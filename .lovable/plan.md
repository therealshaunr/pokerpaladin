# Paladin: Brand + Shop + Voice + Simulator + Charity

## 1. Header rebrand — "Poker Paladin" wordmark with mystic staff
- New `src/components/PaladinWordmark.tsx` reusing the merch crest, with a faint vertical staff SVG behind it and a soft gold/violet glow. Used in `_authenticated.app.tsx`, home `SiteNav`, and portal.

## 2. Shop — sizes, oversize upcharge, shipping, veteran badge
- `catalog.ts`: add `XXXL`, `OVERSIZE_SIZES = ["XL","XXL","XXXL"]`, `OVERSIZE_UPCHARGE_PCT = 20`, `STANDARD_SHIPPING = 2999`, `EXPEDITED_SHIPPING = 1999`, `FREE_SHIPPING_THRESHOLD = 10000`.
- `cart.tsx`: unit price multiplied by 1.20 when size ∈ oversize. Shipping method state ("standard" | "expedited"); free Standard at $100+, Expedited always $19.99 (overrides free, since user pays for speed).
- `shop.$slug.tsx`: "XL+ adds 20%" hint on size selector.
- `shop.cart.tsx`: shipping toggle, `VeteranBadge` above Checkout button.

## 3. Charity donation at checkout (NEW)
- New `CharityDonation.tsx` panel in cart: preset chips ($1 / $5 / $10 / $25 / Custom) — "Add a donation supporting the Wounded Warrior Project. 100% passes through."
- Donation added as an extra Stripe line item (`name: "Wounded Warrior Project Donation"`, `unitAmount: donationCents`) in `createMerchCheckout` payload. Doesn't count toward free-shipping threshold or bundle discount — purely additive.
- Summary row shows "Donation" line in gold; receipt copy notes it's a pass-through contribution.

## 4. Cart cross-sell — plan & add-ons + apparel cadence
- "Complete your kit" panel surfacing Paladin plans + add-ons (Pocket etc.) at top of cart; clicking opens the existing plan checkout in a separate Stripe session.
- Apparel-add dialog: "Make this a recurring drop? Monthly / Quarterly / Yearly / One-time." Recurring options are stubbed (placeholder price IDs) until you confirm — does NOT touch the user's app subscription.

## 5. Voice — Paladin speaks (off by default)
- `src/lib/audio.ts`: `playPaladinCue(kind)` using browser `SpeechSynthesis` (no deps). Toggle persisted in localStorage; default OFF.
- Switch added to `GameSetup.tsx` + `ScanPanel.tsx` header strip.
- `Recommendation.tsx` fires the cue on new verdict, only when toggle on AND `playable` (no chatter on empty tables).

## 6. About / Founder placeholder
- New `src/routes/about.tsx`: "Veteran Owned. Built at the Table." Founder placeholder (Air Force vet, idea born at the table), Wounded Warrior callout, VA volunteer line. Linked from footer + QuickLinksRail.

## 7. Simulator — restore visible entry
- Add "Simulator" tab in `_authenticated.app.tsx` next to Scan / Go Live, routing to the existing `PokerTable.tsx` flow so users can practice without a live game.

## Files

```
NEW   src/components/PaladinWordmark.tsx
NEW   src/components/VeteranBadge.tsx
NEW   src/components/CartUpsell.tsx
NEW   src/components/CharityDonation.tsx
NEW   src/components/SizeSubscribePrompt.tsx
NEW   src/lib/audio.ts
NEW   src/routes/about.tsx
EDIT  src/lib/merch/catalog.ts
EDIT  src/lib/cart.tsx
EDIT  src/lib/merch.functions.ts       (accept donation + expedited)
EDIT  src/routes/shop.cart.tsx
EDIT  src/routes/shop.$slug.tsx
EDIT  src/routes/_authenticated.app.tsx
EDIT  src/routes/_authenticated.portal.tsx
EDIT  src/routes/index.tsx
EDIT  src/components/QuickLinksRail.tsx
EDIT  src/components/poker/Recommendation.tsx
EDIT  src/components/poker/GameSetup.tsx
EDIT  src/components/poker/ScanPanel.tsx
```

No DB migrations. No new Stripe products required for v1 (apparel-subscription IDs stubbed; donation uses inline `price_data`).

## Quick clarifications (I'll default these if you don't reply)
1. **Expedited vs free shipping** → defaulting to "Expedited $19.99 always, even if cart >$100" (you pay for speed).
2. **Apparel subscription** → stubbing UI, no Stripe products yet.
3. **Voice** → browser TTS for v1 (free, robotic). ElevenLabs upgrade later.