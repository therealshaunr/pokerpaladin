# Phase 1.5 — Polish, Rebrand, and the Go-Live Fold Bug

Locked decisions: **The Arcanum** (Pro-tier collective), **Focus Lens** (replaces "Chrome Extension"), **Summon the Paladin →** (replaces "Deal in"), keep the interactive demo (no video loop).

---

## 1. Landing page copy rewrite (`src/routes/index.tsx`)

**New hero subheading** (replaces the current paragraph):
> Poker Paladin tracks every card, bet, and tell on your screen in as close to real time as possible. Standard players read the table. **The Arcanum** reads the players reading the table. Want millisecond reactions and live in-hand calls? You'll need to go Pro.

**Features section** — rework the third card to lead with the differentiator:
- **Go Live (Pro)** — "The first sub-second poker co-pilot. Our Go-Live analyzer re-reads the table every heartbeat and surfaces the play before your timer ticks. This is what separates a standard player from **The Arcanum**."

**Add-ons section** — replace the "Chrome Extension" card with:
- **Focus Lens — $10/mo** · *Capture from a single window you choose, not your whole screen. Read-only pixel capture — never touches the page, never reads code, never communicates with any site.*
- (Update the same wording in `/pricing` add-on grid.)

**Trust block** — add one line: "Focus Lens is a window-scoped screen capture, not a browser extension. Nothing is ever installed into the poker site's page."

---

## 2. "Summon the Paladin →" button

- `src/components/poker/GameSetup.tsx` — change `Deal in →` to `Summon the Paladin →`.
- Tighten the setup screen sub-copy to: *"Pick your game. Set your blinds. Summon the paladin."*

---

## 3. New route: `/how-to-play` (basics for novice players)

Create `src/routes/how-to-play.tsx` with short, plain-English primers for each supported variant. One card per game, ~120 words each:

- **Texas Hold'em** — 2 hole cards, 5 community, best 5-card hand wins.
- **Omaha (PLO)** — 4 hole cards, must use exactly 2 + 3 board.
- **7-Card Stud** — no community, 7 cards dealt across streets, best 5.
- **Short Deck (6+)** — 36-card deck, flush beats full house.
- **Razz / Stud Hi-Lo** (if supported in `VARIANTS`).

Each card ends with: *"Want the paladin to play this with you? [Open the analyzer →]"*

Add to `SiteNav` and `SiteFooter`.

---

## 4. New route: `/user-guide` (the flow + setup checklist + troubleshooting)

Create `src/routes/user-guide.tsx` with three sections:

**A. Before the hand starts (2–3 min setup):**
1. Open your poker client and join the table.
2. In Poker Paladin → pick the variant, enter blinds/ante, set the level timer if applicable.
3. Add seat count and your seat position.
4. Hit **Summon the Paladin →**.
5. Click **Share screen** (or **Focus Lens** if you have the add-on) and pick the poker window.

**B. During the hand:**
- Add hole cards once dealt.
- Standard tier: hit **Best play** when it's your turn.
- Pro tier: leave **Go Live** on — the verdict updates automatically and locks the moment it's your action.

**C. Troubleshooting:**
- Verdict feels stale → confirm the timer chip says "Reading…"; re-share the correct window.
- Cards not detected → drag the capture region tighter, increase your client's card size.
- Verdict flipped between turns → *now fixed; see release notes*. If you still see it, file a ticket from `/portal`.
- Voice silent (Pro) → enable mic permission for the browser tab.

Add to `SiteNav` and `SiteFooter`.

---

## 5. **BUG FIX — "Phantom Fold" in Go-Live**

**Symptom (user-reported):** While Go-Live is running, the panel correctly says "Raise/Call", then between actions flips to "Fold" before it's the hero's turn again. Disorienting and damages trust.

**Root cause** (`src/components/poker/Recommendation.tsx`):
The auto-recompute `useEffect` runs on every change to `heroKey/boardKey/pot/toCall/heroToAct/activeOpponents.length` regardless of whose turn it is. As opponents act, `toCall`/`pot` mutate, `decide()` re-runs against a state where it's not the hero's decision, and the worst-case branch resolves to **Fold**, overwriting the previously shown verdict.

**Fix (frontend-only, surgical):**
1. **Gate the auto-run on `heroToAct`:** only call `run()` when `ready && !busy && heroToAct`. When `heroToAct === false`, leave the existing `result` mounted *only* if it was computed for the current street; otherwise clear it.
2. **Stamp each result with a street/board signature.** Track `lastSolvedKey = boardKey + heroKey`. On opponent action (board unchanged, heroToAct false), keep the last verdict frozen and dim it with a "Locked — waiting for your turn" badge instead of recomputing.
3. **On board change while not hero's turn** (new flop/turn/river dealt while folded): clear `result` and show "Waiting for your turn" — never display a stale verdict from a previous street.
4. **Remove the eslint-disable line** once deps are corrected.

This eliminates the phantom Fold entirely: the panel only ever shows a verdict that was computed for *this hero, this street, this decision point*.

---

## 6. Files touched

- `src/routes/index.tsx` — hero copy, features, add-on card, trust block.
- `src/routes/pricing.tsx` — Focus Lens rename + copy.
- `src/components/poker/GameSetup.tsx` — button + subhead.
- `src/components/poker/Recommendation.tsx` — phantom-Fold fix.
- `src/routes/how-to-play.tsx` — **new**.
- `src/routes/user-guide.tsx` — **new**.
- `src/routeTree.gen.ts` — register the two new routes.
- `SiteNav` / `SiteFooter` (inside `index.tsx`) — add Guide + How to Play links.

No DB, no backend, no new packages. Pure UI + one logic fix.

---

## What's NOT in this phase

- Phase 2 (Stripe/PayPal webhooks, license keys, usage metering, support tickets, admin portal) — untouched, picks up next.
- Demo video loop — explicitly skipped per your pick.
- Voice Companion bundling decision — still open from earlier; will confirm at start of Phase 2.
