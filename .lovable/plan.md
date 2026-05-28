# Poker Co-Pilot — Streamline & Auto-Pilot

## 1. Slimmed-down config screen (`GameSetup.tsx`)
- Keep only two inputs: **Game** (variant picker) and **Display name**.
- Remove Players / Starting stack / Minutes-per-level / Antes-from-level fields from the UI (defaults stay in `DEFAULT_CONFIG`; the auto-scan fills the real numbers from the table).
- Add a visible **lock** on the card (lock icon + "Locked" label) and a secret-code gate:
  - A password input; user must type `paladinpoker` to enable the "Deal in →" button.
  - Wrong/empty code keeps the button disabled with a subtle hint. Not secure — just a light block (checked client-side).

## 2. Deal-in triggers an auto-scan
- When **Deal in** is pressed (game starts), automatically run one table analysis (same path as ScreenShare's "Analyze once") to fill the blanks:
  - Each player's **chip stack** and seats.
  - **Pot / to-call**, hero cards, board.
  - **Blinds + level**: read the on-screen blinds and sync the level index to the matching schedule level.
  - **Clock**: if a tournament clock is visible, sync the timer to it; if no clock is detected, leave the timer **OFF by default** with a toggle so the user can turn it on manually.
- Requires the screen share to already be connected; if not connected yet, show a prompt to connect first, then the scan runs on the next analyze.

## 3. Vision schema additions (`vision.functions.ts` + `types.ts`)
- Extend `VisionResult` with: `smallBlind`, `bigBlind`, `ante` (numbers|null), `clockSeconds` (number|null, the tournament clock if shown), and `heroToAct` (boolean — is it the hero's turn).
- Update the prompt to read blinds, the level clock, and whether it's the hero's turn to act.
- `useGame` gets a `syncMeta()` to map detected blinds → nearest schedule level, set/clear the clock, and a `clockOn` flag (default false unless a clock was detected).

## 4. Side-by-side layout (`index.tsx`)
- Put the **live table reader (ScreenShare)** and the **PokerTable** side by side for quick glancing, instead of the reader being tucked in a narrow right column.
- Recommendation + blinds/cards arranged below/around so the table + reader are the focal pair.

## 5. Big red "WHAT TO DO" call-out (`Recommendation.tsx`)
- Directly under the Pot / To-call section, add a prominent **WHAT TO DO** block in large **red** letters.
- It states the concrete action: `CALL`, `FOLD`, `CHECK`, `RAISE`, plus sizing when raising — `RAISE 1/2 POT (Xchips)`, `3/4 POT`, `FULL POT`, or `ALL IN`, or a plain chip number.
- **Auto-surfaces the moment it's the hero's turn**: when vision reports `heroToAct` (and hero has cards), the best-play decision runs automatically and the red verdict snaps front-and-center — no need to press a button. Manual "Best play" stays available.

## Technical notes
- Decision→sizing: derive pot-fraction label from `Decision` (verdict + recommended amount vs. pot) so the red text shows the right fraction/all-in/number.
- Auto-run guard: only re-trigger the auto decision when `heroToAct` flips true (dedupe so it doesn't recompute every frame).
- Clock toggle + `clockOn` live in `useGame`; `BlindTimer` respects it (paused/hidden countdown when off, manual on switch).
- All new colors via existing semantic tokens in `styles.css` (red = existing destructive/danger oklch token).
