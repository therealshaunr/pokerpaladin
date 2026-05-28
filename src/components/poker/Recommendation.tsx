import { useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { decide, readProfile, fieldLooseness, type Decision } from "@/lib/poker/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown } from "lucide-react";

const VERDICT_STYLE: Record<string, string> = {
  Fold: "bg-[oklch(0.4_0.04_165)] text-foreground",
  Check: "bg-secondary text-foreground",
  Call: "bg-[oklch(0.78_0.16_85)] text-[oklch(0.2_0.04_160)]",
  Bet: "bg-[oklch(0.72_0.18_145)] text-black",
  Raise: "bg-[oklch(0.65_0.2_40)] text-black",
  Shove: "bg-[oklch(0.58_0.22_27)] text-white",
};

export function Recommendation({ game, street }: { game: GameApi; street: string }) {
  const { variant, hero, board, pot, toCall, setPot, setToCall, blind, heroSeat, activeOpponents, profiles, config } = game;
  const [result, setResult] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const run = () => {
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

  const minHole = variant.holeCount === 7 ? 2 : variant.holeCount;
  const ready = hero.length >= Math.min(2, minHole);

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
