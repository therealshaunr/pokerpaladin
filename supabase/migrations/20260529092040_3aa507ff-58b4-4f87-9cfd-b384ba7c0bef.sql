-- 1. Add referral fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS how_heard text;

-- 2. Generate unique referral code (8 chars, no ambiguous)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
  attempt int := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
    attempt := attempt + 1;
    IF attempt > 8 THEN RAISE EXCEPTION 'Could not generate referral code'; END IF;
  END LOOP;
  RETURN candidate;
END $$;

-- 3. Referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid NOT NULL UNIQUE,
  referee_email text NOT NULL,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  qualified_at timestamptz,
  rewarded_at timestamptz,
  reward_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals participants select" ON public.referrals
  FOR SELECT TO authenticated 
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "referrals admin select" ON public.referrals
  FOR SELECT TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "referrals admin update" ON public.referrals
  FOR UPDATE TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "referrals service manage" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

CREATE TRIGGER touch_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Update handle_new_user to assign codes and link referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_by text;
  referrer uuid;
BEGIN
  ref_by := upper(NULLIF(trim(NEW.raw_user_meta_data->>'referred_by_code'), ''));

  INSERT INTO public.profiles (id, name, display_name, phone, referral_code, referred_by_code, how_heard)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    public.generate_referral_code(),
    ref_by,
    NEW.raw_user_meta_data->>'how_heard'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF ref_by IS NOT NULL THEN
    SELECT id INTO referrer FROM public.profiles WHERE referral_code = ref_by AND id <> NEW.id LIMIT 1;
    IF referrer IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referee_id, referee_email, referral_code, status)
      VALUES (referrer, NEW.id, NEW.email, ref_by, 'pending')
      ON CONFLICT (referee_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Backfill referral codes for existing profiles
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;