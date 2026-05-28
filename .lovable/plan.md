# Poker Co-Pilot — Look & Feel + Live Table Reader

Two tracks: (1) a bold "wizard meets night-shades poker meets anon-hacker" visual system, and (2) an upgraded screen-share engine that watches the table and auto-fills cards, board, and every player's actions, with per-player "why are they betting" read-outs.

## Track 1 — Visual System

**Palette** (black base, Matrix green, white data, wizard-purple metallic accent):
- Background: near-black `#05080a`
- Surfaces/felt: very dark green-black
- Primary data text (numbers, cards, actions): crisp white
- Signal/alive color: Matrix green `#00ff9c` (live capture, equity, "good" verdicts)
- Accent: metallic wizard purple `#8b5cf6 → #c4a3ff` gradient for headers, the AI verdict, glows
- Danger/fold: muted red

**Treatments**
- Subtle scanline / matrix-grid texture overlay on the background.
- Monospace display font for stats/cards (terminal feel) paired with a clean sans for body.
- Purple metallic gradient + soft glow on the main recommendation card and section headers.
- Green "LIVE" pulse indicator when screen-share is actively reading.
- Animated card flips (framer-motion) when cards get auto-filled.

All tokens go into `src/styles.css` (oklch); components use semantic classes only.

## Track 2 — Live Table Reader

Reworks `ScreenShare.tsx` + `vision.functions.ts` + `useGame.tsx`.

**Poker-table UI**
- Replace the flat seat list with an oval poker-table layout: seats positioned around the felt, hero at the bottom, board + pot in the center.
- Each seat shows: name/seat #, stack, last action (chip-stack/fold badge), and a behavioral tag chip (Bluffer / Station / Shark…).
- Action log rendered as a live ticker beside the table.

**Capture loop (event-driven, near real-time)**
- Grab frames locally (~1–2 fps into a hidden canvas).
- Cheap local change-detection (frame diff): only send a frame to AI when something visibly changed (new card, chips moved, a player acted). This keeps it close to real-time without burning credits on idle frames.
- A clear LIVE toggle plus a manual "Analyze now" button; status line shows last read + when.

**What the AI returns (expanded vision schema)**
Per snapshot, structured JSON:
- `hero` cards, `board` cards, `pot`, `toCall`
- `seats[]`: `{ id/username, stack, hasCards, lastAction (fold/check/call/bet/raise/allin), betAmount, isHero, isEmpty }`
- `dealerSeat` / street hint

**Seat locking + roster changes**
- On a new deal, AI reads usernames / seat numbers and **locks** them to tracked profiles for the hand.
- **No cards = folded** for the current hand (strict): once folded, stays folded.
- **Cards reappear** → treated as a **new hand**, roster re-synced, fold flags reset.
- **Knockout/leave**: a seat that goes empty is retired; if a **new player** sits, they're auto-registered as a fresh profile and enter the analytics from that point.

**Per-player "why" read-out**
- Each detected action is logged through the existing profiling pipeline (VPIP/PFR/aggression).
- The seat card surfaces a one-line read: e.g. *"3x open from early — likely value (PFR 9%, rarely bluffs)"* or *"Overbet vs passive line — possible bluff (AF 4.1)"*, derived from the local profile stats in `strategy.ts` (no extra AI cost).
- Tap a seat → deeper breakdown (stats, Caro-style tag, notes).

## Technical notes
- `vision.functions.ts`: widen `VisionResult` to include `seats[]` + dealer/street; update the prompt to read every seat's chips/cards/action; keep strict-JSON parsing with safe fallbacks. Continue using Gemini vision via Lovable AI; surface 429/402 errors in the UI.
- `useGame.tsx`: add `syncFromVision()` to reconcile detected seats with tracked players (lock by name, apply folds, handle empty seats + new entrants, detect new-hand resets), and an action-dedup guard so the same bet isn't double-logged across frames.
- `ScreenShare.tsx`: add the frame-diff change detector + LIVE loop; route results into `syncFromVision()` and card/board/pot setters.
- New `PokerTable.tsx` component for the oval table + seats; `Recommendation.tsx` restyled with the purple-metallic verdict.
- Honesty guardrail kept: vision pre-fills, the local Monte Carlo engine remains source of truth, and every auto-filled value stays manually editable.

## Build order
1. Theme tokens + texture + fonts in `styles.css`.
2. `PokerTable.tsx` oval layout + restyled seats/recommendation.
3. Expand vision schema + prompt.
4. `syncFromVision()` reconciliation (folds, new hand, roster changes, dedup).
5. Event-driven LIVE capture loop + change detection in `ScreenShare.tsx`.
6. Per-seat "why" read-outs from local stats.

A note on reality: a browser can't silently hook into another window — you pick the tab/window to share, and vision won't be 100% perfect, so reads stay editable. But with the LIVE loop it'll feel close to real-time and auto-correct as the hand plays out.