# Poker Paladin — Pro Launch Feature Pack

Big build. Shipping in priority order across two phases so each phase lands as a working, testable slice rather than a 20-file mega-commit.

## Scope decisions

- Voice TTS and opponent tendencies already exist (`src/lib/audio.ts`, `PokerTable` profile reads). I will surface, harden, and gate them — not rebuild.
- Mobile second-screen pairing already exists (`pocket.install.tsx`, `PocketQRCard.tsx`). I will polish the viewer copy + add an explicit "Mobile Second Screen" entry in the app header so users find it.
- Quick equity already runs inside `Recommendation` (Monte Carlo). I will add a compact "Equity vs ranges" strip (vs random / vs top 20% / vs pair+) so it reads as a calculator, not buried inside the verdict.
- All new heavy features are Pro-gated through the existing `tier` value already loaded in `_authenticated.app.tsx`.

## Phase 1 — Multi-Table + gating (ship first)

**New: `src/lib/poker/useMultiTable.tsx`**
- Holds an array of up to 4 `GameApi` instances created via `useGame()` per table slot.
- `activeTableId`, `tables: { id, label, game, live }`, `addTable`, `removeTable`, `setActive`.
- Persists table labels in `localStorage`.

**New: `src/components/poker/TableTabs.tsx`**
- Thumbnail tab strip across the top of `_authenticated.app.tsx`. Each tab shows label, mini pot, green pulsing dot when `shared.isLive`, close button. "+ Add table" button disabled when count == 4 or user not Pro.

**Edit: `src/routes/_authenticated.app.tsx`**
- If `tier === 'pro'`: render `TableTabs` and switch `game` to `activeTable.game`. Each table preserves its own cards/board/pot/share session.
- If Standard: render single-table flow as today, plus a locked "Multi-Table (Pro)" pill that opens upgrade dialog.

**New: `src/components/UpgradeToProDialog.tsx`**
- Reusable. Shows price ($79.99/mo), bullet list (Multi-Table, Session Review, Advanced Tendencies, Voice Coach, Mobile Second Screen), CTA → `/pricing`.

## Phase 2 — Session Review + Smart Leak Finder (Pro)

**Edit: `src/lib/poker/useGame.tsx`**
- Add `handHistory: HandRecord[]` ring buffer in memory: `{ ts, street, hero, board, pot, toCall, decision, actionTaken? }`.
- `recordHand(record)` called from `Recommendation` whenever a fresh verdict is computed for a live hand (dedup by `streetKey`).
- `endSession()` returns the array and clears it.

**New: `src/lib/poker/leakFinder.ts`**
- Pure analysis over `HandRecord[]`:
  - Aggression Factor, VPIP-proxy, fold-to-3bet-proxy from recorded decisions.
  - Detect leaks: over-folding (folded with ≥45% equity), missed value (checked/called with ≥65% equity and small pot), overbluffing rivers, calling stations preflop.
  - Top 5 most expensive hands by `(equity * pot - evCall)` delta against Paladin's verdict.

**New: `src/components/poker/SessionReport.tsx`**
- Modal/sheet triggered by new "End Session" button in app header (Pro only).
- Sections: headline ("3 leaks, est. -$240 EV"), leak cards with examples, Top 5 hands list (board + hero + what Paladin said vs what was logged), simple SVG radar chart (5 axes: Aggression, Fold Frequency, Value Capture, Bluff Discipline, Preflop Tightness).
- "Save report" stores JSON to `localStorage` keyed by session start; "Print/Share" prints clean view.
- Educational disclaimer footer.

## Phase 3 — Tendency callouts, Equity strip, Mobile polish, Voice surface

**Edit: `src/components/poker/Recommendation.tsx`**
- New compact "Equity vs ranges" row under verdict (Pro-only): three pills — vs random, vs top 20%, vs JJ+/AK. Reuses existing Monte Carlo with weighted ranges.
- Tendency callout banner: when an opponent profile has ≥10 hands and a notable tag (LAG, station, overbet-happy), show one-liner ("Button villain is loose-aggressive — overbet 4x when checked to"). Pro only; Standard sees teaser.

**Edit: `src/components/poker/ScanPanel.tsx`**
- Promote voice toggle into a labeled "Voice Coach" switch with mini description "Paladin calls Fold/Call/Raise out loud" and disclaimer text.

**Edit: `src/routes/pocket.tsx`** (Mobile second-screen viewer)
- Bigger verdict typography, equity %, "PALADIN SAYS" headline, educational disclaimer footer. No layout overhaul — just clarity and size.

**Edit: `src/routes/_authenticated.app.tsx` header**
- Add "Mobile Second Screen" quick link → `/pocket/install`.
- Add "End Session" button (Pro) → opens `SessionReport`.

## Cross-cutting

**Disclaimers**
- Add `<EducationalDisclaimer />` component (small muted footer line) on app, pocket viewer, and session report: "Poker Paladin is an educational training tool. Use only where permitted by the operator/venue."

**Subscription gating helper**
- New `src/lib/useTier.ts` — returns `{ tier, isPro, requirePro(featureName) }` reading from existing query in `_authenticated.app.tsx`. Lift the query into this hook so multiple components share it without refetching.

**No DB migrations.** Session reports stay client-side for v1.

## Technical notes

- No new npm deps. Radar chart is hand-rolled SVG (≤40 lines).
- Voice already uses `speechSynthesis` — no provider change.
- Multi-table memory cost: 4 × `useGame` ≈ trivial; Monte Carlo only runs for the active table.
- Tendency tracker piggybacks on existing `profiles` map in `useGame`; I'll add `recordOpponentAction` already partially present and expose a `tendencyTag(profile)` helper.

## Files

**Create (8):** `useMultiTable.tsx`, `TableTabs.tsx`, `UpgradeToProDialog.tsx`, `leakFinder.ts`, `SessionReport.tsx`, `useTier.ts`, `EducationalDisclaimer.tsx`, `TendencyCallout.tsx`.

**Edit (6):** `_authenticated.app.tsx`, `useGame.tsx`, `Recommendation.tsx`, `ScanPanel.tsx`, `pocket.tsx`, `PaladinWordmark.tsx` (small "Pro" badge variant).

## Out of scope for this build

- Persisting session reports to Supabase (client-side first; can promote to DB later).
- Real-range solver for equity strip (using existing Monte Carlo with simple range weights).
- Native mobile app — second-screen stays a web view.

Approve and I'll ship Phase 1 → 2 → 3 in that order.