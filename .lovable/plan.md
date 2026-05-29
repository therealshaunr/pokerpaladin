# Next Phase: Mobile + AI Bot + Debug Tool + Simulator

Four independent features, built in order so you can test each as it lands.

---

## 1. Paladin Pocket (Mobile companion — Android + iOS)

**Approach: Installable PWA** (one codebase, both platforms, no app store wait, downloadable from the homepage today).

- New route `/pocket` — mobile-optimized read-only view of the live Paladin session.
- Pairing flow: portal generates a 6-digit code + QR → user scans on phone → phone calls `claimMobileLink` server fn → row in existing `mobile_links` table binds the device to the user's session.
- Realtime: phone subscribes to a Supabase channel (`paladin:{userId}`) that the desktop app publishes equity / pot odds / decision / board to. No video — just the verdict card + table state (low bandwidth, works on cell data).
- Web manifest + minimal service worker scoped to `/pocket` only (guarded so it never registers in the Lovable preview iframe — per PWA rules in the stack).
- Homepage gets a "Get Paladin Pocket" section with two QR codes:
  - **iOS QR** → opens `/pocket/install/ios` with Safari "Add to Home Screen" instructions + screenshots.
  - **Android QR** → opens `/pocket/install/android` with Chrome "Install app" instructions.
- Both install pages double as the landing for the QR so a single URL works.
- Replace the current `/coming-soon` mobile card on the portal with a live "Pair phone" button.

**Why PWA, not native**: native iOS/Android requires Apple Developer ($99/yr), Google Play ($25), build pipelines, and store review — none of which fit "downloadable from the homepage today". PWA installs in 2 taps, updates instantly when you ship, and uses the same auth/session as the web app. If you later want a store presence, the same code wraps in Capacitor.

---

## 2. Compatibility & Security Docs

New route `/help/compatibility` with three tabs:

- **macOS** — Screen Recording permission (System Settings → Privacy & Security → Screen Recording → enable browser), camera/mic prompts, Safari "Allow on Every Visit", popup blocker exceptions.
- **Windows 11** — Edge/Chrome screen-share consent, Defender SmartScreen, "Choose what to share" dialog walkthrough, notification permissions.
- **Mobile** — iOS Safari "Add to Home Screen", Android install prompt, background-tab throttling notes.

Each tab: numbered steps, screenshots (generated), and a "Still stuck? Ask Paladin Bot" CTA that opens the AI bot pre-loaded with that context.

Link from: portal header (help icon), Go Live panel error states, and the Paladin Bot itself.

---

## 3. Paladin AI Bot

Floating chat widget available everywhere when signed in (portal, /app, /shop, /help).

**Capabilities**:
- Answers questions about the site (pricing, plans, refund policy, how Go Live vs Scan differ).
- Quick poker reference: rules + hand rankings for NLHE, PLO, Stud, Razz, etc. (pulled from `src/lib/poker/types.ts` variants).
- Troubleshooting: walks user through compatibility doc steps interactively, can suggest opening the debug tool (see #4) and reading captured logs.
- Has the user's tenant context: current plan, recent scan events, recent support tickets — so it can say "I see your last Go Live session ended 3 min ago with an error, here's likely cause."

**Tech**:
- New server fn `chatWithPaladinBot` using AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview` default — cheap + fast, matches your credit concern).
- System prompt bundles: site copy summary, poker rules cheatsheets, compatibility steps, and user context fetched server-side.
- Tools the bot can call: `getMyPlan`, `getMyRecentErrors`, `openDebugCapture`, `linkToCompatibilityDoc(os)`.
- UI: `<PaladinBot />` widget in `__root.tsx`, hidden on landing/login. Streamed responses, markdown rendering.

---

## 4. Debug Capture Tool

New portal card "Run diagnostics". When launched:

- Opens `/portal/debug` with a "Start capture" button.
- Captures (client-side, scoped to current tab):
  - Browser + OS + screen resolution + devicePixelRatio
  - Active plan, role, user id
  - Last 200 console log lines (intercepted via `console.*` wrapper)
  - Last 50 network requests (fetch/xhr URLs + status, no bodies)
  - Last 20 scan_events from DB
  - Active permissions (camera, mic, display-capture state)
- User clicks "Reproduce issue" → app opens in a new tab with capture still running → user does the broken thing → returns and clicks "Stop & send".
- POSTs the bundle to `submitDebugCapture` server fn → stored in new `debug_captures` table → linked to a support ticket → admin sees it in `SupportInbox`.
- Bot can read the capture and explain it.

---

## 5. NL Hold'em Simulator ("Take it for a drive")

New route `/simulator` linked from the landing page hero and portal.

**Setup screen**: variant (locked to NLHE for v1), # players 2–8, starting stack, your name. Big "Deal" button.

**Table**:
- 8 seats around an oval felt (reuses `PokerTable` styling). Seat 1 = hero, bottom-right, cards face-up.
- Other seats: face-down cards, AI opponents with simple ranges (tight/loose mix).
- Action buttons for hero only: **Check / Fold / Call / Raise** with a single dollar input (no preset sizings).
- Hands play out preflop → flop → turn → river → showdown using existing `engine.ts` evaluator. Opponents act with basic equity-based logic.
- Pot, stacks, dealer button update per hand.

**Paladin toggle** (top-right of table):
- OFF by default. Toggling ON shows: "⚠️ Simulation mode — full Paladin selects your live monitor."
- When ON, a slim panel appears with live equity %, pot odds %, EV, and decision verdict — recalculated every street.
- Calculations use the same `strategy.ts` the real app uses, so the user sees the actual product brain working on their actual cards.
- Code obfuscation: simulator-only strategy calls go through a wrapper that strips internals (no rationale source, no weights) — just outputs. The full `strategy.ts` is never bundled into the simulator chunk; the wrapper lives in `src/lib/sim/paladin-lite.ts` and only exposes `evaluate(hero, board, pot, toCall) → { equity, potOdds, ev, decision }`.

---

## Build Order (so you can test as we go)

1. **Simulator** (~30 min) — pure frontend, no infra. Instant gratification + demo asset.
2. **Compatibility docs** (~15 min) — static content, helps right now.
3. **Paladin Pocket PWA + QR pairing** (~45 min) — needs `mobile_links` already exists, add 1 migration for `device_label`.
4. **Debug capture tool** (~30 min) — new `debug_captures` table + UI.
5. **Paladin AI Bot** (~45 min) — last because it consumes the most credits and benefits from having the docs + debug tool to reference.

## Technical Notes

- All new routes follow `createFileRoute` dot-naming.
- Bot uses AI SDK `streamText` + `useChat` per stack convention; costs ~$0.0001 per short message on Gemini Flash.
- PWA service worker is guarded: only registers on `pokerpaladin.lovable.app` + custom domain, never in preview iframe.
- Simulator runs 100% client-side — zero server cost.
- One Supabase migration total (debug_captures + mobile_links.device_label).

Approve and I'll build in the listed order, pausing after the simulator so you can take it for a drive.
