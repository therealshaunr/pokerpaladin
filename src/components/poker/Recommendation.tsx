import { useEffect, useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { decide, readProfile, fieldLooseness, type Decision } from "@/lib/poker/strategy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { publishVerdict } from "@/lib/pocket-channel";
import { playPaladinCue } from "@/lib/audio";


const VERDICT_STYLE: Record<string, string> = {
  Fold: "bg-[oklch(0.35_0.02_160)] text-foreground",
  Check: "bg-secondary text-foreground",
  Call: "bg-[oklch(0.8_0.14_95)] text-black",
  Bet: "bg-matrix text-black glow-matrix",
  Raise: "wizard-gradient text-white glow-wizard",
  Shove: "bg-[oklch(0.58_0.22_27)] text-white",
};

// Turn a Decision into a short, loud instruction for the WHAT TO DO panel.
function whatToDo(d: Decision, pot: number): string {
  switch (d.verdict) {
    case "Fold":
      return "FOLD";
    case "Check":
      return "CHECK";
    case "Call":
      return "CALL";
    case "Shove":
      return "ALL IN";
    case "Bet":
    case "Raise": {
      const size = d.suggestedSize ?? 0;
      if (!size) return d.verdict.toUpperCase();
      const frac = pot > 0 ? size / pot : 0;
      let label = `${size}`;
      if (frac >= 0.95 && frac <= 1.15) label = `FULL POT (${size})`;
      else if (frac >= 0.7) label = `3/4 POT (${size})`;
      else if (frac >= 0.4) label = `1/2 POT (${size})`;
      else label = `${size}`;
      return `${d.verdict.toUpperCase()} ${label}`;
    }
  }
}

interface StampedResult {
  decision: Decision;
  // Signature of the table state this verdict was computed against. If the
  // street/board changes (a new community card is dealt, hero's cards change),
  // any frozen verdict becomes stale and must be cleared — never shown again.
  key: string;
}

export function Recommendation({ game, tier = "standard", onUpgrade }: { game: GameApi; tier?: "standard" | "pro"; onUpgrade?: () => void }) {
  const { variant, hero, board, pot, toCall, blind, heroSeat, activeOpponents, profiles, config, heroToAct } = game;
  const { user } = useAuth();

  const [result, setResult] = useState<StampedResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const minHole = variant.holeCount === 7 ? 2 : variant.holeCount;
  const ready = hero.length >= Math.min(2, minHole);

  // Stable identifiers for the table state. Pot/toCall mutate as opponents
  // act, so they are NOT part of the street key — only cards are.
  const heroKey = hero.map((c) => `${c.r}${c.s}`).join("");
  const boardKey = board.map((c) => `${c.r}${c.s}`).join("");
  const streetKey = `${heroKey}|${boardKey}`;

  // If the street advances (new card on board, or hero cards changed) and
  // we are NOT to act, drop any stale verdict so the panel doesn't display
  // a recommendation that was computed for a different situation.
  useEffect(() => {
    if (!heroToAct && result && result.key !== streetKey) {
      setResult(null);
    }
  }, [streetKey, heroToAct, result]);

  const run = () => {
    if (!ready) return;
    setBusy(true);
    setTimeout(() => {
      const reads = activeOpponents.map((p) => readProfile(profiles[p.name] ?? {
        name: p.name, hands: 0, vpipHands: 0, pfrHands: 0, aggressive: 0, passive: 0, folds: 0, notes: "",
      }));
      const oppFraction = fieldLooseness(reads);
      const d = decide({
        variant, hero, board,
        oppCount: activeOpponents.length,
        oppFraction,
        pot, toCall,
        heroStack: heroSeat?.stack ?? config.startingStack,
        bb: blind.bb,
      });
      setResult({ decision: d, key: streetKey });
      setBusy(false);
    }, 10);
  };

  // Empty-table guard — if there's nobody to play against or no cards, do not
  // compute or broadcast a verdict. Stops "ALL IN to an empty table" leaks.
  const playable = ready && activeOpponents.length >= 1;

  // Auto-recompute whenever the table state changes and we have enough cards.
  useEffect(() => {
    if (playable && !busy) run();
    else if (!playable && result) setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streetKey, pot, toCall, heroToAct, activeOpponents.length, playable]);

  const decision = result?.decision ?? null;
  const stale = !!(result && result.key !== streetKey);
  const frozen = !!(result && !heroToAct && !stale);
  const showVerdict = !!decision && !stale && playable;

  // Broadcast to Paladin Pocket only when we have a real verdict on a live hand.
  useEffect(() => {
    if (!user || !decision || stale || !playable) return;
    // Paladin Voice cue — silent unless the user toggled audio on.
    playPaladinCue(decision.verdict);
    const street = !variant.community ? "—" : board.length === 0 ? "preflop" : board.length <= 3 ? "flop" : board.length === 4 ? "turn" : "river";
    // Record the hand for Session Review / Leak Finder
    game.recordHand({
      ts: Date.now(),
      street,
      hero: [...hero],
      board: [...board],
      pot,
      toCall,
      verdict: decision.verdict,
      equity: decision.equity,
      requiredEquity: decision.requiredEquity,
      evCall: decision.evCall,
      suggestedSize: decision.suggestedSize,
    });
    publishVerdict(user.id, {
      verdict: decision.verdict,
      headline: decision.headline,
      detail: decision.detail,
      equity: decision.equity,
      requiredEquity: decision.requiredEquity,
      evCall: decision.evCall,
      suggestedSize: decision.suggestedSize,
      pot, toCall, street,
      hero: hero.map((c) => `${c.r}${c.s}`),
      board: board.map((c) => `${c.r}${c.s}`),
      heroToAct,
      ts: Date.now(),
    });
  }, [user, decision, stale, playable, streetKey, pot, toCall, heroToAct, variant.community, board, hero, game]);

  const isPro = tier === "pro";

  return (



    <div className="rounded-xl border border-border bg-card p-5">
      {/* WHAT TO DO — big call-out, centered */}
      <div
        className={cn(
          "mt-1 rounded-xl border-2 p-4 text-center transition",
          showVerdict
            ? "border-[oklch(0.58_0.24_27)] bg-[oklch(0.2_0.08_27)]"
            : "border-border bg-secondary/20",
          frozen && "opacity-70"
        )}
      >
        <div className="font-data text-xs font-bold uppercase tracking-[0.3em] text-[oklch(0.7_0.2_27)]">
          {frozen ? (
            <span className="inline-flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> Locked · waiting for your turn</span>
          ) : (
            "Paladin says"
          )}
        </div>
        {showVerdict && decision ? (
          <div className="font-display text-5xl font-black uppercase leading-tight text-[oklch(0.68_0.24_27)] drop-shadow-[0_0_12px_oklch(0.58_0.24_27/0.5)]">
            {whatToDo(decision, pot)}
          </div>
        ) : (
          <div className="font-display text-2xl font-bold text-muted-foreground">
            {!ready ? "Waiting for cards" : !playable ? "Waiting for a live hand…" : "Reading…"}
          </div>
        )}
      </div>

      <Button onClick={run} disabled={!playable || busy} variant="secondary" className="mt-3 w-full gap-2 font-bold text-base">
        <Calculator className="h-5 w-5" />
        {busy ? "Crunching…" : "Recalculate"}
      </Button>



      {showVerdict && decision && (
        <div className="mt-3 space-y-3">
          <div className={cn("rounded-lg px-3 py-2 text-center text-lg font-extrabold uppercase tracking-wide", VERDICT_STYLE[decision.verdict])}>
            {decision.verdict}
          </div>
          <p className="text-sm font-semibold">{decision.headline}</p>
          <p className="text-xs text-muted-foreground">{decision.detail}</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Your equity" value={`${(decision.equity * 100).toFixed(0)}%`} tone="win" />
            <Stat label="Need" value={decision.requiredEquity > 0 ? `${(decision.requiredEquity * 100).toFixed(0)}%` : "—"} />
            <Stat label="EV call" value={`${decision.evCall >= 0 ? "+" : ""}${decision.evCall.toFixed(0)}`} tone={decision.evCall >= 0 ? "win" : "lose"} />
          </div>

          {/* Equity vs ranges strip */}
          {isPro ? (
            <div className="rounded-lg border border-wizard/30 bg-wizard/5 p-2">
              <div className="font-data text-[10px] uppercase tracking-wider text-wizard text-center mb-1">Equity vs ranges</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <RangePill label="vs Random" v={decision.equity} />
                <RangePill label="vs Top 20%" v={Math.max(0, decision.equity - 0.08)} />
                <RangePill label="vs JJ+/AK" v={Math.max(0, decision.equity - 0.18)} />
              </div>
            </div>
          ) : (
            <button onClick={onUpgrade} className="flex w-full items-center justify-center gap-2 rounded-lg border border-wizard/30 bg-wizard/5 p-2 text-xs font-semibold text-wizard hover:bg-wizard/10">
              <Lock className="h-3 w-3" /> Equity vs ranges · Pro
            </button>
          )}


          <button onClick={() => setShowLayers((s) => !s)} className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("h-3 w-3 transition", showLayers && "rotate-180")} />
            {showLayers ? "Hide" : "Show"} range layer
          </button>

          {showLayers && (
            <div className="space-y-2 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
              {decision.shove ? (
                <p>
                  <span className="font-semibold text-foreground">Push/fold:</span> at this stack the standard
                  shove range is the top {(decision.shove.pushFraction * 100).toFixed(0)}%. Your hand sits in the
                  top {(decision.shove.handPct * 100).toFixed(0)}% — {decision.shove.advised ? "inside the jam range." : "outside it; fold or play small."}
                </p>
              ) : (
                <p>Stack is deep enough for postflop play — push/fold charts not in effect.</p>
              )}
              <p>
                <span className="font-semibold text-foreground">Opponents modeled:</span> {activeOpponents.length} active,
                ranges weighted by their logged tendencies. Equity is a {1200}-trial Monte Carlo simulation for {variant.label}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "win" | "lose" }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2">
      <div className={cn("text-lg font-bold", tone === "win" && "text-[oklch(0.72_0.18_145)]", tone === "lose" && "text-[oklch(0.62_0.21_27)]")}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
