import { useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings2, Users, Clock, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function AllInOneEditor({ game }: { game: GameApi }) {
  const [open, setOpen] = useState(false);
  const { players, setPlayers, blind, manualBlind, setManualBlind, clockOn, setClockOn, secondsLeft, config, setConfig, newHand } = game;

  const updateBlind = (patch: Partial<{ sb: number; bb: number; ante: number }>) => {
    const base = manualBlind ?? { sb: blind.sb, bb: blind.bb, ante: blind.ante };
    setManualBlind({ ...base, ...patch });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="relative flex w-full items-center justify-center p-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Settings2 className="h-4 w-4 text-matrix" />
          <span className="font-display text-sm font-bold uppercase tracking-wide">All-in-One Editor</span>
          <span className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">seats · blinds · clock</span>
        </div>
        <ChevronDown className={cn("absolute right-4 h-4 w-4 transition", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 border-t border-border p-4">

        {/* Blinds & ante */}
        <section>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Coins className="h-3 w-3" /> Blinds & ante
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="SB" value={blind.sb} onChange={(v) => updateBlind({ sb: v })} />
            <Field label="BB" value={blind.bb} onChange={(v) => updateBlind({ bb: v })} />
            <Field label="Ante" value={blind.ante} onChange={(v) => updateBlind({ ante: v })} />
          </div>
        </section>

        {/* Clock */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" /> Level timer
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tabular-nums">{fmt(secondsLeft)}</span>
              <Switch checked={clockOn} onCheckedChange={setClockOn} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Level minutes"
              value={config.levelMinutes}
              onChange={(v) => setConfig({ ...config, levelMinutes: Math.max(1, v) })}
            />
            <Field
              label="Antes from level"
              value={config.anteFromLevel}
              onChange={(v) => setConfig({ ...config, anteFromLevel: Math.max(1, v) })}
            />
          </div>
        </section>

        {/* Seats */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3 w-3" /> Seats ({players.length})
            </div>
            <Button size="sm" variant="ghost" onClick={newHand} className="h-6 text-[10px]">New hand</Button>
          </div>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <span className="w-6 text-center font-data text-[10px] text-muted-foreground">{p.id + 1}</span>
                <Input
                  value={p.name}
                  onChange={(e) => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                  className="h-7 flex-1 text-xs"
                />
                <div className="relative w-24">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-data text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={p.stack || ""}
                    onChange={(e) => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, stack: Number(e.target.value) || 0 } : x)))}
                    className="h-7 pl-5 font-data text-xs"
                  />
                </div>
                <Switch
                  checked={p.inHand}
                  onCheckedChange={(v) => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, inHand: v } : x)))}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] italic text-muted-foreground">
            Stacks default to <span className="text-matrix">$</span> until you type — Paladin still works with partial data; numbers just sharpen the math.
          </p>
        </section>

      </CollapsibleContent>
    </Collapsible>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
      <Input
        type="number"
        min={0}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 h-7 font-data text-xs"
      />
    </label>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
