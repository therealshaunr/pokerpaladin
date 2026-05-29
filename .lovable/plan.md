
# Poker Paladin — Phase 2 Plan

Builds on the auth/portal foundation already in place. Adds billing, license-key activation, usage metering, support tickets, legal pages, and a full visual overhaul.

## 1. Pricing & packaging (final)

| Plan | Price/mo | Scans/day | Go-Live hours/mo | Voice | Hand export |
|---|---|---|---|---|---|
| **Standard** | $79.99 | 250 manual scans | — | no | no |
| **Pro** | $149.99 | unlimited | **60 hrs** included | yes | yes |

**Add-ons (recurring monthly unless noted):**
- Voice Companion — $10/mo (Pro only) *(already baked into Pro per your $89 example → keeping it as a Pro-only toggle, $0 if you'd rather bundle. **Confirm**)*
- Chrome Extension — $10/mo
- Mobile Renderer — $8/mo
- **Go-Live Hour Pack** — $14.99 one-time, +10 hours (rolls over 90 days)

Crypto = "Coming Soon" badge on checkout (Changelly placeholder).

**Trial:** No license-gated trial. A public `/demo` page lets anyone try a frozen sample hand + analyzer mock (no real screen capture). Encourages signup.
**Refund:** 7-day money-back, account auto-disabled on refund. Posted on `/refund-policy`.

## 2. License-key activation flow

```text
Stripe / PayPal webhook
        │
        ▼
billing.functions: handlePaymentSuccess
  • create/find subscription row
  • generate 25-char key (groups of 5, e.g. PLDN7-X4K2M-…)
  • store in license_keys (user_id, plan, addons[], status='unused')
  • enqueue confirmation email with key
        │
        ▼
User opens /portal → "Activate License" card
  • pastes key
  • server validates → flips subscriptions.activated=true
  • entitlements_view now returns plan + addons
        │
        ▼
/app gates on getEntitlements().activated === true
```

**Admin override:** `/admin/users/:id` has plan + addon toggles that bypass the key requirement (for refunds, comps, support). All writes log to `audit_log`.

## 3. Usage metering

Every scan + every minute of Go-Live writes to `usage_events(user_id, kind, qty, ts)`. A SQL view `usage_current_period` aggregates per billing cycle.

**Shown to user** in `/portal` sidebar:
- Scans today: 42 / 250
- Go-Live this month: 14.3 / 60.0 hrs
- Next reset: Jun 28

**Shown to admin** in `/admin/users/:id`: same plus all-time totals, cost is hidden.

Soft enforcement: when Go-Live hits 100%, banner appears with "Buy 10-hour pack" CTA; scanning continues for 5 grace minutes then pauses until purchase.

## 4. Support tickets (no email)

New tables: `support_tickets`, `ticket_messages`.

- `/portal/support` — list + "New Ticket" (category: billing / bug / question / feature)
- `/portal/support/:id` — threaded view, user + admin can reply
- `/admin/tickets` — queue with filters, assign, status (open/pending/closed)
- Realtime via Supabase Realtime channel `ticket:{id}` so replies appear without refresh
- Only system email = password reset, payment confirmation + license key, refund confirmation. Everything else stays in-app.

## 5. Pages to build/update

```text
Public
  /                      marketing landing (NEW theme + paladin hero)
  /pricing               2 tiers + addons + go-live packs + crypto badge
  /faq                   what it is, what it isn't, legal stance
  /disclaimer            novelty/training tool, no scraping/injection, user accepts ToS
  /refund-policy         7-day rule
  /demo                  frozen sample hand (no signup needed)
  /docs/*                user guides
  /login /signup /reset-password

_authenticated
  /portal                plan, usage meters, activate license, support, downloads
  /portal/billing        manage sub, buy hour packs, change plan, invoices
  /portal/activate       paste 25-char key
  /portal/support        tickets list + thread view
  /app                   analyzer (gated by entitlements.activated)

_authenticated/_admin
  /admin/users           list, filter, search
  /admin/users/:id       toggles for plan + addons, usage, reset license, suspend/freeze
  /admin/tickets         queue
  /admin/billing         failed payments, manual activations
  /admin/audit
```

## 6. Database changes (new tables)

```text
license_keys(id, user_id, key_hash, plan, addons[], status, generated_at, activated_at, revoked_at)
usage_events(id, user_id, kind, qty, session_id, ts)         -- kind: scan|golive_min
hour_packs(id, user_id, hours, hours_remaining, expires_at, purchased_at)
support_tickets(id, user_id, category, subject, status, assigned_admin, created_at, updated_at)
ticket_messages(id, ticket_id, author_id, body, created_at)
payments(id, user_id, provider, amount_cents, currency, kind, stripe_event_id, paypal_id, status, ts)
```
All with RLS scoped to `auth.uid()` + admin override via `has_role`. Key stored hashed; only emailed in plaintext once.

## 7. Visual overhaul — "Obsidian & Arcane Purple"

- Update `src/styles.css` tokens: background `#0a0612`, surface `#1a0f2e`, primary `#6b21a8` (arcane purple), accent `#d4a84c` (rune gold). Drop the bright matrix green to a *muted* secondary used only for "go" states.
- Typography: keep Orbitron headings + JetBrains Mono data, add `Cinzel` for landing headlines (rune-y serif).
- New hero illustration (generated): hooded paladin holding a staff wrapped in shredded playing-card shreds, purple smoke, gold sigils. Used on `/`, `/pricing`, and as portal avatar.
- Card / button surfaces get subtle purple→gold gradient borders, sigil watermarks on hero sections.
- Re-skin analyzer chrome to match (panels, badges, "WHAT TO DO" still high-contrast but in gold-on-deep-purple).

## 8. Payments wiring

- **Stripe seamless** for cards + Apple/Google Pay (recurring subs + one-time hour packs).
- **PayPal** via PayPal JS SDK button on checkout (subs + one-time).
- **Crypto** = disabled "Coming Soon" tile linking to FAQ entry.
- One webhook route per provider under `/api/public/` with signature verification → both feed the same `handlePaymentSuccess` server fn → license-key generation.

## 9. Phased build order

1. **Theme + landing/marketing pages** (visual overhaul + paladin hero + FAQ + disclaimer + refund + demo) — shippable first, validates direction.
2. **DB schema** (license_keys, usage_events, hour_packs, tickets, payments).
3. **Stripe seamless enable** + products + checkout + webhook + license-key generation + confirmation email.
4. **Portal: activate license, usage meters, billing screen**.
5. **Entitlement gates** on `/app` (analyzer + Go-Live + voice) + usage metering writes.
6. **Support tickets** (user + admin sides, realtime).
7. **Admin portal** (user CRUD, plan/addon toggles, ticket queue, audit log).
8. **PayPal** added to checkout.
9. **Crypto placeholder + Changelly affiliate link**.

## 10. Open items to confirm before I start

1. Voice Companion — bundled in Pro for free, or +$10/mo addon? (Your $89 example suggested addon; my plan put $149.99 Pro with voice included. Pick one.)
2. Go-Live hours included with Pro: **60/mo** OK? (≈14 hrs/week)
3. Hour pack price: **$14.99 / 10 hrs** OK?
4. Standard daily scan cap: **250** OK?
5. Should the demo page require email capture (lead-gen) or be fully anonymous?
