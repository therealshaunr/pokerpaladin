import { useEffect, useRef, useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { decide, readProfile, fieldLooseness, type Decision } from "@/lib/poker/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown } from "lucide-react";

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
    default:
      return d.verdict.toUpperCase();
  }
}

export function Recommendation({ game, street }: { game: GameApi; street: string }) {
  const { variant, hero, board, pot, toCall, setPot, setToCall, blind, heroSeat, activeOpponents, profiles, config, heroToAct } = game;
  const [result, setResult] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const minHole = variant.holeCount === 7 ? 2 : variant.holeCount;
  const ready = hero.length >= Math.min(2, minHole);

  const run = () => {
    if (!ready) return;
    setBusy(true);
    // let the button paint, then crunch
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
      setResult(d);
      setBusy(false);
    }, 10);
  };

  // Auto-surface the play the moment it's the hero's turn.
  const wasHeroToAct = useRef(false);
  useEffect(() => {
    if (heroToAct && !wasHeroToAct.current && ready && !busy) {
      run();
    }
    wasHeroToAct.current = heroToAct;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroToAct, ready]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted-foreground">
          Pot
          <Input type="number" value={pot} onChange={(e) => setPot(Number(e.target.value))} className="mt-1 h-8" />
        </label>
        <label className="text-xs text-muted-foreground">
          To call
          <Input type="number" value={toCall} onChange={(e) => setToCall(Number(e.target.value))} className="mt-1 h-8" />
        </label>
      </div>

      {/* WHAT TO DO — big red call-out, front and center */}
      <div
        className={cn(
          "mt-3 rounded-xl border-2 p-3 text-center transition",
          result
            ? "border-[oklch(0.58_0.24_27)] bg-[oklch(0.2_0.08_27)]"
            : "border-border bg-secondary/20"
        )}
      >
        <div className="font-data text-[10px] font-bold uppercase tracking-[0.3em] text-[oklch(0.7_0.2_27)]">
          What to do
        </div>
        {result ? (
          <div className="font-display text-3xl font-black uppercase leading-tight text-[oklch(0.68_0.24_27)] drop-shadow-[0_0_12px_oklch(0.58_0.24_27/0.5)]">
            {whatToDo(result, pot)}
          </div>
        ) : (
          <div className="font-display text-lg font-bold text-muted-foreground">
            {heroToAct ? "Reading…" : "Waiting for your turn"}
          </div>
        )}
      </div>

      <Button onClick={run} disabled={!ready || busy} className="mt-3 w-full gap-2">
        <Calculator className="h-4 w-4" />
        {busy ? "Crunching…" : "Best play"}
      </Button>
      {!ready && <p className="mt-2 text-center text-xs text-muted-foreground">Add your hole cards first.</p>}

      {result && (
        <div className="mt-3 space-y-3">
          <div className={cn("rounded-lg px-3 py-2 text-center text-lg font-extrabold uppercase tracking-wide", VERDICT_STYLE[result.verdict])}>
            {result.verdict}
          </div>
          <p className="text-sm font-semibold">{result.headline}</p>
          <p className="text-xs text-muted-foreground">{result.detail}</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Your equity" value={`${(result.equity * 100).toFixed(0)}%`} tone="win" />
            <Stat label="Need" value={result.requiredEquity > 0 ? `${(result.requiredEquity * 100).toFixed(0)}%` : "—"} />
            <Stat label="EV call" value={`${result.evCall >= 0 ? "+" : ""}${result.evCall.toFixed(0)}`} tone={result.evCall >= 0 ? "win" : "lose"} />
          </div>

          <button onClick={() => setShowLayers((s) => !s)} className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("h-3 w-3 transition", showLayers && "rotate-180")} />
            {showLayers ? "Hide" : "Show"} range layer
          </button>

          {showLayers && (
            <div className="space-y-2 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
              {result.shove ? (
                <p>
                  <span className="font-semibold text-foreground">Push/fold:</span> at this stack the standard
                  shove range is the top {(result.shove.pushFraction * 100).toFixed(0)}%. Your hand sits in the
                  top {(result.shove.handPct * 100).toFixed(0)}% — {result.shove.advised ? "inside the jam range." : "outside it; fold or play small."}
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
