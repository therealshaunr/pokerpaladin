## 1. Fix the iOS/Android install links

**Bug:** `/pocket/install` and `/pocket` sit at the root, but the QR target `/pocket` requires auth, so visiting on a phone (or via the homepage buttons) triggers a redirect that the route renders as a hard `ErrorComponent` ("This page didn't load"). The root `ErrorComponent` is treating a `redirect()` throw as a fatal error.

**Fix:**
- Make `/pocket/install` 100% public (no auth, no redirects). It is currently public but its QR points at the protected `/pocket`. Add a second QR on the install page that opens `/login?redirect=/pocket` so first-time mobile users land on the login screen instead of a crash.
- In `src/routes/__root.tsx` `ErrorComponent`, detect TanStack `redirect` objects (`error?.options?.to` or `isRedirect(error)`) and call `router.navigate(error.options)` instead of rendering the error UI. This stops `/pocket` from showing "This page didn't load" pre-login.
- On the homepage, keep the two install buttons but point them directly at `/pocket/install` (already correct) — verify the link works after the error-boundary fix.

## 2. Live-play safety: stop auto-scanning a dead table

**Problem:** GO LIVE keeps polling every 2.5s even when nobody is at the table, producing "ALL IN" calls into the void.

**Fix in `useSharedShare` + `GoLivePanel` + `ScanPanel`:**
- Add a derived `tableActive` flag from the last vision read: active = `seats` has ≥ 2 non-empty seats with `hasCards`, OR `heroToAct` is true, OR `pot > bb`. Track `consecutiveEmptyReads`.
- After **3 consecutive empty reads** (~7.5s on Pro, ~24s on Standard), auto-stop the scan loop, drop screen-share to **Standby**, and show a calm "Table idle — standby. Press Resume when you sit back down." card. No further AI calls until the user clicks Resume.
- Hero-side guard in `Recommendation.tsx`: if `activeOpponents.length < 1` OR `hero.length < 2`, clear the verdict and show "Waiting for a live hand" instead of computing/broadcasting. Prevents the "go all in to an empty table" leak.
- Add a **prominent pause toggle** on the GO LIVE panel: a big `Pause auto-scan` / `Resume` switch (separate from the Live button), so the user can break without disconnecting the share. Persist the paused state across re-renders.

## 3. In-app layout & typography refinements

In `src/routes/_authenticated.app.tsx` and children:
- **Bump text up 2 sizes across the live app**: change base `text-[15px] md:text-[17px]` → `text-[17px] md:text-[19px]`; scale headings (`text-2xl md:text-3xl` → `text-3xl md:text-4xl`), and bump font-sizes in `Recommendation.tsx` (verdict from `text-3xl` → `text-5xl`, stats from `text-lg` → `text-2xl`, labels from `text-[10px]` → `text-xs`). Same bump in `GoLivePanel` and `ScanPanel`.
- **Reorder the right column**: GO LIVE → **Your cards** (move card picker up directly under GO LIVE) → **Paladin Says** → Board picker. Currently Paladin Says sits right under GO LIVE and the card picker is at the bottom.
- **Shift "Paladin Says" to the left**: keep the right column, but make the verdict block left-aligned within its panel (`text-left` instead of `text-center`) so it reads naturally beside the hero card chips.
- **Center & justify the GO LIVE vs SCAN NOW chart** in `TierComparison.tsx`: wrap in `mx-auto` (already there) and add `text-justify` to the descriptive paragraph; ensure the comparison rows are visually centered on desktop (`sm:grid-cols-[1fr_140px_140px]` symmetric, content centered).

## 4. Paladin AI Bot (one conversation, no history)

**Decision:** single conversation per session, no persistence (per user choice). Each browser tab gets a fresh chat; nothing stored in DB or localStorage.

**Build:**
- Install AI Elements: `bun x ai-elements@latest add conversation message prompt-input shimmer`.
- Create server route `src/routes/api/bot.ts` using `streamText` + the Lovable AI Gateway helper (`google/gemini-3-flash-preview`). System prompt includes: Paladin tier matrix, pricing, compatibility tips (macOS/Win/Mobile), refund policy, how SCAN NOW vs GO LIVE works, links to `/user-guide`, `/faq`, `/compatibility`, `/pocket/install`.
- Add `src/lib/ai-gateway.server.ts` (the canonical helper) if not present.
- Tools (lightweight, all read-only — no `needsApproval`):
  - `getMyPlan` — middleware-auth wrapper around `subscriptions` SELECT, returns tier/status.
  - `linkToCompatibilityDoc({ os })` — returns one of three help anchors.
  - `linkToPocketInstall()` — returns `/pocket/install`.
- Frontend: `src/components/PaladinBot.tsx` — floating button (bottom-right) with `Conversation` + `MessageContent` + `MessageResponse` + `PromptInput` + `Shimmer` "Thinking…". Mount in `__root.tsx` inside `AuthProvider` so it's available on every page (hide on `/pocket*` to keep mobile UI clean).
- Use a generated mini staff/sigil icon as the bot identity (not Sparkles). Reuse `paladin-icon-512.png` for the avatar.

## 5. Technical notes

- The auth gate currently fires through `_authenticated.tsx` `beforeLoad` — verify the redirect helper there is reachable and the root error boundary respects it (`isRedirect`).
- `useSharedShare.runAnalyze` already returns the parsed result; refactor it to also set a shared `lastResult` state so `tableActive` can be derived in one place and consumed by both panels.
- AI bot streaming route lives at `/api/bot` (NOT `/api/public/bot` — keep it behind the normal auth surface to discourage abuse; pass the user's session via the existing AI Elements transport).
- No DB migration needed for this turn (bot has no history; pause state is in-memory).

## Files touched

- `src/routes/__root.tsx` — error boundary + bot mount
- `src/routes/pocket.install.tsx` — extra `/login?redirect=/pocket` QR
- `src/components/poker/GoLivePanel.tsx` — pause toggle, standby logic, idle detection
- `src/components/poker/ScanPanel.tsx` — share standby on idle
- `src/components/poker/Recommendation.tsx` — empty-table guard, broadcast guard, text-size bumps, left-align
- `src/components/poker/TierComparison.tsx` — center + justify
- `src/routes/_authenticated.app.tsx` — text scale, column reorder
- `src/lib/ai-gateway.server.ts` — new (gateway helper)
- `src/routes/api/bot.ts` — new (streaming chat route)
- `src/components/PaladinBot.tsx` — new (floating bot)
- `src/components/ai-elements/*` — installed via AI Elements CLI
- `package.json` / `bun.lock` — `ai`, `@ai-sdk/openai-compatible`, AI Elements deps

After this turn: the install links open without a crash, GO LIVE can't scream at an empty table, you have a real pause button, the app text is ~2 sizes larger, the right column reads Cards-above-Paladin, the comparison chart is centered, and the Paladin Bot is live across the site.