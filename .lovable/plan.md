
# Poker Paladin — SaaS Conversion Plan

Turn the current single-page Poker Co-Pilot into a multi-tenant subscription product with marketing site, auth, billing, entitlements, admin, and a scalable live-analysis pipeline.

## 1. Scaling answer (the "100k users at once" question)

The current vision flow sends a screenshot to a server function which calls an LLM. That scales well **only if we keep heavy work on the user's device and per-user**:

- **Capture stays in the browser** (already does via `getDisplayMedia`). No video ever hits our servers.
- **Each user's analysis is independent** — there's no shared room, no central game state. So "100k concurrent" is really "100k independent serverless invocations per ~5s," not a realtime fan-out problem.
- **Per-user rate limiting + queueing** on the server fn (e.g., 1 in-flight scan per user, 5s min interval) to cap cost and prevent abuse.
- **Vision provider** = Lovable AI Gateway (already wired). Gateway handles the burst; we bill it back via entitlements (scan credits per tier).
- **Pro "Go Live"** uses the same per-user 5s loop, just auto-triggered. No websockets needed for the core loop.
- **Mobile rendering add-on** (phone shows results while laptop captures) — this IS the only piece that needs a realtime channel. Use Lovable Cloud Realtime (Supabase Realtime) with a per-user channel keyed by `user_id` + short-lived `session_id`. One channel per active session, not per user globally. Scales to hundreds of thousands of channels.
- **Browser-extension add-on** captures locally and POSTs frames to the same server fn — same scaling story.

So: no sharding, no rooms, no central state. Scale = serverless fns + per-user channels + entitlement-gated quotas.

## 2. Tech stack (keep what works)

- TanStack Start + React 19 (current).
- **Lovable Cloud** (Supabase) for auth, Postgres, Realtime, Storage.
- **Lovable Payments** (Stripe seamless) for subscriptions + add-ons (recurring) — best fit for SaaS.
- Lovable AI Gateway for vision + strategy fallback.
- Server functions (`createServerFn`) for all app logic; `/api/public/*` only for Stripe webhooks.

## 3. Database schema (Lovable Cloud)

```
profiles(id=auth.users.id, name, phone, display_name, shipping_*, created_at)
user_roles(user_id, role)                  -- 'admin' | 'user'  (separate table; security-definer has_role)
subscriptions(id, user_id, tier, interval, status, current_period_end,
              stripe_customer_id, stripe_sub_id, activation_id, suspended, frozen)
addons(id, user_id, kind, status, stripe_sub_id)   -- kind: 'extension' | 'mobile_render'
entitlements_view                          -- derived: tier + active add-ons
sessions(id, user_id, variant, started_at, ended_at)
hands(id, session_id, hero_cards, board, pot, decision, ts)
scan_events(id, user_id, session_id, ts, ms, tokens_in, tokens_out)   -- usage + quota
mobile_links(id, user_id, session_id, pair_code, expires_at)          -- phone pairing
audit_log(id, actor_id, target_user_id, action, meta, ts)             -- admin actions
```
RLS: user-owned rows scoped to `auth.uid()`. Admin reads via `has_role(auth.uid(),'admin')`. GRANTs on every public table.

## 4. Frontend page map

```
Public
  /                        marketing landing
  /pricing                 tiers + add-ons + interval toggle
  /docs/*                  configuring levels, antes, timer, connect screen, analyzer, add-ons
  /login  /signup  /reset-password  /verify-email

_authenticated
  /portal                  name, plan, billing, shipping, add-ons, downloads, "Launch Paladin"
  /portal/billing          change plan/interval, add/remove add-ons, invoices
  /portal/account          profile, password, shipping
  /portal/downloads        extension installer, connector, mobile pairing
  /app                     the analyzer (current Index, gated by entitlement)
  /app/session/:id         live session view
  /mobile/:pairCode        phone-side renderer (mobile add-on only)

_authenticated/_admin      (has_role='admin')
  /admin/users
  /admin/users/:id         edit, reset pw, suspend/freeze, activation id
  /admin/billing           failed payments, manual re-enable
  /admin/audit
```

## 5. Backend / server-fn structure

```
auth.functions.ts          signup w/ email verify, profile bootstrap
billing.functions.ts       create checkout session, customer portal, change plan, add/remove addon
entitlements.functions.ts  getEntitlements() -> { tier, addons[], scanQuotaRemaining }
vision.functions.ts        analyzeTable (existing) + quota check + scan_events log
strategy.functions.ts      server-side decision (Pro = richer model)
session.functions.ts       start/end session, log hands, export (Pro)
mobile.functions.ts        createPairCode, claimPairCode, publishFrame
admin.functions.ts         list/edit users, reset pw, suspend, freeze, audit
api/public/stripe-webhook  signed webhook -> updates subscriptions/addons + activation_id
```

## 6. Entitlement & access control

- Single `getEntitlements()` server fn = source of truth, cached per-request.
- Every gated server fn (`analyzeTable`, `exportHand`, `publishFrame`, `voiceGuidance`) calls a `requireEntitlement('pro' | 'extension' | 'mobile_render')` helper that throws 402 on miss.
- UI hides Pro/add-on features when missing and shows upsell.
- Stripe webhook is the only writer to `subscriptions`/`addons`. Failed payment -> `status='past_due'` -> entitlement check fails -> `/app` shows "Payment failed, update card." Admin can override (`suspended`/`frozen` flags) and reset `activation_id`.

## 7. Live-analysis engine changes

Keep current capture + 5s poll. Additions:

- **Quota gate** before each scan; Standard = N scans/day, Pro = unlimited (soft cap).
- **Pro "Go Live"** = same loop but auto + voice output via Web Speech API (no server cost).
- **Hand reset**: detect board clear / new hole cards -> wipe hero+board, start new `hands` row.
- **Mobile renderer**: when mobile add-on active, after each scan publish the *result JSON* (not the frame) to Realtime channel `mobile:{user_id}:{session_id}`. Phone subscribes via pair code. Tiny payload, no video.
- **Strategy fix carryover**: keep the premium-preflop floor + pot-fraction sizing already added.

## 8. Marketing site

New `/`, `/pricing`, `/docs/*` routes. Existing analyzer moves to `/app`. Landing: hero, feature grid, tier compare, add-on cards, FAQ, CTA. AI mascot illustration (hooded guy w/ shades + cards) generated once and used across site + portal chatbot avatar.

## 9. Admin portal

- `_authenticated/_admin` layout uses `has_role` gate.
- Tables of users with filters (tier, status, failed payment).
- Per-user drawer: details, activation id (regenerate), entitlements, suspend/freeze toggles, "send password reset," audit trail.
- All writes go through `admin.functions.ts` and append to `audit_log`.

## 10. Add-ons

- **Extension** ($10/mo recurring): MV3 Chrome extension packaged from `/extension/` and served as `/downloads/paladin-extension.zip`. Extension calls the same server fns with the user's auth token (OAuth-style device link via pair code).
- **Mobile rendering** ($ TBD recurring): pair phone via 6-digit code; phone subscribes to Realtime channel and renders the recommendation UI. No capture on phone.

## 11. Accessibility

- Tokens already in `styles.css`; audit contrast on red "WHAT TO DO" + matrix accents.
- Voice add-on for Pro: Web Speech API, toggle per session, only speaks on action change.
- Responsive breakpoints for phone/tablet/desktop/TV; `h-dvh` not `h-screen`.

## 12. Documentation

Markdown route group `/docs/*` with: Levels, Antes, Timer, Connect Screen, Interpreting Analyzer, Add-ons, Account Setup. Sourced from `src/content/docs/*.md`.

## 13. Phased roadmap

1. **Foundation** — enable Lovable Cloud, auth (email + Google), profiles, user_roles, RLS, marketing skeleton.
2. **Billing** — Stripe seamless, products for 2 tiers × 3 intervals + 2 add-ons, webhook -> subscriptions/addons, entitlements fn.
3. **Portal + gating** — `/portal`, move analyzer to `/app`, wire `requireEntitlement`.
4. **Pro features** — voice, session recording, hand export, Go Live auto-loop.
5. **Admin portal** — users CRUD, suspend/freeze, audit.
6. **Mobile add-on** — pair code + Realtime channel + `/mobile/:code` view.
7. **Extension add-on** — MV3 build + device-link auth.
8. **Docs + landing polish + accessibility pass**.

## 14. Risks / open questions

- **Vision cost at scale** — need Standard daily cap; confirm with you.
- **Stripe vs Paddle** — Stripe seamless recommended (SaaS, global, subs). Confirm.
- **Hand-history accuracy** — current LLM read isn't deterministic; consider lightweight OCR/template-match for chip stacks later.
- **Legal** — screen-scraping real-money poker sites may violate their TOS; ship as "training/analysis tool" with a disclaimer, or restrict to home games / play money. Need your call.
- **Mobile add-on transport** — Realtime over internet is simplest; true LAN/Bluetooth is a v2.
- **Voice in noisy poker rooms** — earbud-only recommendation in UI.

## Open questions for you before build

1. Stripe seamless OK, or do you want Paddle?
2. Standard scan cap — daily number? (suggest 200/day)
3. Mobile add-on price?
4. Real-money sites in scope, or home-games / play-money only?
5. Should the existing `paladinpoker` code gate stay, or be replaced entirely by login?
