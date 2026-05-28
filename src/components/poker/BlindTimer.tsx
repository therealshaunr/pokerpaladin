import type { GameApi } from "@/lib/poker/useGame";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function BlindTimer({ game }: { game: GameApi }) {
  const { blind, secondsLeft, levelIdx, schedule, setLevelIdx, clockOn, setClockOn } = game;
  const nextAnte = schedule[Math.min(levelIdx + 1, schedule.length - 1)]?.ante ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> Level {levelIdx + 1}
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
          <Button size="sm" variant="secondary" onClick={() => setLevelIdx(Math.max(0, levelIdx - 1))}>
            −
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setLevelIdx(Math.min(schedule.length - 1, levelIdx + 1))}>
            +
          </Button>
        </div>
      </div>
    </div>
  );
}
