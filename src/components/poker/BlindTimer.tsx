import type { GameApi } from "@/lib/poker/useGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function BlindTimer({ game }: { game: GameApi }) {
  const { blind, secondsLeft, levelIdx, schedule, setLevelIdx, clockOn, setClockOn, manualBlind, setManualBlind } = game;
  const nextAnte = schedule[Math.min(levelIdx + 1, schedule.length - 1)]?.ante ?? 0;

  const setManual = (patch: Partial<{ sb: number; bb: number; ante: number }>) => {
    const base = manualBlind ?? { sb: blind.sb, bb: blind.bb, ante: blind.ante };
    setManualBlind({ ...base, ...patch });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {manualBlind ? "Manual blinds" : `Level ${levelIdx + 1}`}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-2xl font-bold tabular-nums ${clockOn ? "text-primary" : "text-muted-foreground/50"}`}>
            {fmt(secondsLeft)}
          </span>
          <Switch checked={clockOn} onCheckedChange={setClockOn} aria-label="Toggle clock" />
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">
            {blind.sb} / {blind.bb}
          </div>
          <div className="text-xs text-muted-foreground">
            {blind.ante > 0 ? `+ ${blind.ante} ante` : `ante from L${game.config.anteFromLevel}`}
            {nextAnte > 0 && blind.ante === 0 ? " (next)" : ""}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => { setManualBlind(null); setLevelIdx(Math.max(0, levelIdx - 1)); }}>
            −
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setManualBlind(null); setLevelIdx(Math.min(schedule.length - 1, levelIdx + 1)); }}>
            +
          </Button>
        </div>
      </div>

      {/* Manual stakes — type any low blinds like 1/2, 2/4 */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          SB
          <Input type="number" min={0} value={blind.sb} onChange={(e) => setManual({ sb: Number(e.target.value) })} className="mt-1 h-8" />
        </label>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          BB
          <Input type="number" min={0} value={blind.bb} onChange={(e) => setManual({ bb: Number(e.target.value) })} className="mt-1 h-8" />
        </label>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Ante
          <Input type="number" min={0} value={blind.ante} onChange={(e) => setManual({ ante: Number(e.target.value) })} className="mt-1 h-8" />
        </label>
      </div>
      {manualBlind && (
        <button
          onClick={() => setManualBlind(null)}
          className="mt-2 text-[11px] text-muted-foreground underline hover:text-foreground"
        >
          Back to tournament schedule
        </button>
      )}
    </div>
  );
}
