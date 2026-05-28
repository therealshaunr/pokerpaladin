import { useState } from "react";
import { type GameConfig, DEFAULT_CONFIG } from "@/lib/poker/useGame";
import { VARIANTS, type VariantId } from "@/lib/poker/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spade } from "lucide-react";

export function GameSetup({ onStart }: { onStart: (cfg: GameConfig) => void }) {
  const [cfg, setCfg] = useState<GameConfig>(DEFAULT_CONFIG);
  const set = <K extends keyof GameConfig>(k: K, v: GameConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  return (
    <div className="felt-surface min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Spade className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Poker Co-Pilot</h1>
          <p className="text-sm text-muted-foreground">Configure your game, then deal in.</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(VARIANTS) as VariantId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => set("variantId", id)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition",
                    cfg.variantId === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="text-sm font-semibold">{VARIANTS[id].label}</div>
                  <div className="text-[11px] text-muted-foreground">{VARIANTS[id].blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Players" value={cfg.numPlayers} min={2} max={10} onChange={(v) => set("numPlayers", v)} />
            <Field label="Starting stack" value={cfg.startingStack} min={100} step={100} onChange={(v) => set("startingStack", v)} />
            <Field label="Minutes / level" value={cfg.levelMinutes} min={1} max={60} onChange={(v) => set("levelMinutes", v)} />
            <Field label="Antes from level" value={cfg.anteFromLevel} min={1} max={16} onChange={(v) => set("anteFromLevel", v)} />
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your name</span>
            <Input value={cfg.heroName} onChange={(e) => set("heroName", e.target.value)} className="mt-1" />
          </label>

          <Button onClick={() => onStart(cfg)} className="w-full text-base font-bold">
            Deal in →
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, min, max, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))} className="mt-1" />
    </label>
  );
}
