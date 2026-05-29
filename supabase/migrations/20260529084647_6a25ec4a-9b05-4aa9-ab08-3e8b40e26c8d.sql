
-- ============ Extend subscriptions for Stripe webhook + license keys ============
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS license_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS go_live_seconds_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS go_live_seconds_included integer NOT NULL DEFAULT 0;

-- align Stripe sub id column name with the webhook convention; keep old as alias if present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id text;
    UPDATE public.subscriptions SET stripe_subscription_id = stripe_sub_id WHERE stripe_subscription_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_stripe_subscription_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subs_user_env ON public.subscriptions(user_id, environment);

-- service_role full access for webhook
GRANT ALL ON public.subscriptions TO service_role;

-- allow service role to insert/update via webhook
DROP POLICY IF EXISTS "service manages subscriptions" ON public.subscriptions;
CREATE POLICY "service manages subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ Extend addons similarly ============
ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS license_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz; -- for one-time topups

ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='addons' AND column_name='stripe_sub_id') THEN
    UPDATE public.addons SET stripe_subscription_id = stripe_sub_id WHERE stripe_subscription_id IS NULL;
  END IF;
END $$;

GRANT ALL ON public.addons TO service_role;
DROP POLICY IF EXISTS "service manages addons" ON public.addons;
CREATE POLICY "service manages addons" ON public.addons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ License key issuance log ============
CREATE TABLE IF NOT EXISTS public.license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL UNIQUE,
  tier_code text NOT NULL,        -- PRO | STD | LNS | VOX | MOB | TOP
  sku text NOT NULL,              -- M001 | Y001 | A001 | T001 etc
  price_id text NOT NULL,
  product_id text,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  addon_id uuid REFERENCES public.addons(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',  -- active | suspended | revoked
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text
);

GRANT SELECT ON public.license_keys TO authenticated;
GRANT ALL ON public.license_keys TO service_role;

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licenses self select" ON public.license_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "licenses admin select" ON public.license_keys
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "licenses service manage" ON public.license_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ Support tickets (portal-only, no email) ============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'other', -- billing | bug | feature | account | other
  status text NOT NULL DEFAULT 'open',    -- open | in_progress | resolved | closed
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_reply_by text -- 'user' | 'admin'
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets self select" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tickets self insert" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets self update" ON public.support_tickets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tickets admin select" ON public.support_tickets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "tickets admin update" ON public.support_tickets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tickets_touch BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_role text NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msgs_ticket ON public.ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msgs participants select" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "msgs participants insert" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
  );

-- ============ License key generator (security definer) ============
CREATE OR REPLACE FUNCTION public.generate_license_key(_tier text, _sku text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  body text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- avoid 0/O/1/I
  i int;
  attempt int := 0;
  candidate text;
BEGIN
  LOOP
    body := '';
    FOR i IN 1..12 LOOP
      body := body || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    END LOOP;
    candidate := 'PALADIN-' || upper(_tier) || '-' || body || '-' || upper(_sku);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.license_keys WHERE key = candidate);
    attempt := attempt + 1;
    IF attempt > 5 THEN
      RAISE EXCEPTION 'Could not generate unique license key';
    END IF;
  END LOOP;
  RETURN candidate;
END $$;

-- ============ Go-Live usage aggregation (sum of scan_events seconds in current month) ============
CREATE OR REPLACE FUNCTION public.get_go_live_usage(_user_id uuid)
RETURNS TABLE(seconds_used integer, hours_used numeric, period_start timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH period AS (
    SELECT date_trunc('month', now()) AS p_start
  )
  SELECT
    COALESCE(SUM(s.ms)/1000, 0)::int AS seconds_used,
    ROUND(COALESCE(SUM(s.ms)/3600000.0, 0)::numeric, 2) AS hours_used,
    (SELECT p_start FROM period) AS period_start
  FROM public.scan_events s, period
  WHERE s.user_id = _user_id
    AND s.ts >= period.p_start;
$$;
