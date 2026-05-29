
# Consolidate Stripe under your BlackGrid Cyber / BlitzbuyAI account

Goal: route all Poker Paladin payments (subscriptions, add-ons, top-ups, merch) to the same Stripe account that already serves BlackGrid Cyber and BlitzbuyAI, so you get one balance, one payout, one 1099.

Good news: you're still in sandbox/test mode here, so **no customer data or live subscriptions exist** that need migrating. This is just a re-attach.

---

## What you do (in Stripe / Lovable dashboard)

These are user actions — I can't perform them from inside the codebase.

1. **Disconnect the current Stripe sandbox**
   Open the Payments dashboard in this project → three-dots menu (top right) → "Disconnect Stripe". This unlinks the current unclaimed sandbox.

2. **Re-enable Stripe payments on this project**
   From the Payments dashboard, enable Stripe again. Lovable creates a new claimable sandbox.

3. **Claim the new sandbox INTO your existing account**
   When you hit the "Claim sandbox" step, **sign in to your existing BlackGrid Cyber / BlitzbuyAI Stripe account** instead of creating a new one. Stripe attaches this project's sandbox to that account.

4. **Complete go-live**
   Since your existing account is already verified for the other ventures, steps 2 & 3 of go-live (business verification, bank, etc.) will be mostly pre-filled or auto-pass. Step 4 (live key provisioning) is automated.

---

## What I do in the codebase (after you've reconnected)

The seamless Stripe integration auto-injects `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` / webhook secrets, so most code stays untouched. But two things need re-running because Stripe products/prices don't carry over between connections:

1. **Recreate the price catalog in the new account** via `payments--create_product` / `payments--create_price` for every entry in `src/lib/stripe.ts` `PRICE_CATALOG`:
   - `std_monthly`, `std_yearly` (Standard plan)
   - `pro_monthly`, `pro_yearly` (Pro plan)
   - `voice_monthly`, `lens_monthly`, `mobile_monthly` (add-ons)
   - `topup_10h_once` (one-time 10-hour pack)

   The human-readable IDs (`pro_monthly`, etc.) stay identical, so **zero changes to checkout code, `useTier`, the webhook handler, or `payments.functions.ts`**. Tax codes (`txcd_10103001` SaaS / `txcd_30070003` apparel) get re-applied during recreation.

2. **Tag products with metadata** so you can filter Poker Paladin transactions out of your unified Stripe dashboard:
   ```
   metadata: { venture: "poker_paladin" }
   ```
   Set on each Product so the existing BlackGrid/Blitzbuy charges stay distinguishable in reports.

3. **Sanity-check the webhook** — `src/routes/api/public/payments/webhook.ts` uses `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET` from env, which Lovable rotates automatically on reconnect. No code changes, but I'll verify the env vars repopulated by calling `secrets--fetch_secrets`.

4. **Run a $0.50 test checkout** in sandbox to confirm the new connection works end-to-end (cart → Stripe Checkout → webhook fires → license issued).

---

## What does NOT need to change

- App code: `stripe.ts`, `stripe.server.ts`, `payments.functions.ts`, `merch.functions.ts`, webhook route — all unchanged.
- Database schema (`subscriptions`, `addons`, `license_keys`) — unchanged.
- The Lovable AI Gateway connection (separate from Stripe).
- Pricing displayed on `/pricing` — unchanged.

---

## Reporting separation (heads up)

With one Stripe account serving three ventures, your Stripe dashboard shows all transactions together. To keep Poker Paladin's books clean:
- I'll add `metadata.venture = "poker_paladin"` to every Product (done in step 1 above).
- In Stripe dashboard you can filter Payments / Subscriptions by that metadata.
- If you want hard separation later (separate 1099s, separate dispute history), you'd switch to "separate accounts, same payout bank" instead. Easy to revisit; nothing here locks you in.

---

## Order of operations

```text
You: disconnect current Stripe in Payments dashboard
  ↓
You: re-enable Stripe, claim into BlackGrid/BlitzbuyAI account
  ↓
You: complete go-live (fast — account already verified)
  ↓
Me: recreate 8 products/prices with venture metadata + tax codes
  ↓
Me: verify webhook secrets repopulated
  ↓
Me: run sandbox test checkout, confirm webhook + license flow
  ↓
You: flip to live mode in Payments dashboard
```

Ready when you are — kick off step 1 in the Payments dashboard and tell me when you've claimed into the existing account. I'll handle the rest.
