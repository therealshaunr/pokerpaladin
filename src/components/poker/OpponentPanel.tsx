import { useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { readProfile } from "@/lib/poker/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TAG_STYLE: Record<string, string> = {
  shark: "bg-[oklch(0.5_0.15_260)] text-white",
  station: "bg-[oklch(0.6_0.16_145)] text-black",
  maniac: "bg-[oklch(0.58_0.22_27)] text-white",
  rock: "bg-[oklch(0.45_0.03_165)] text-white",
  lag: "bg-[oklch(0.65_0.2_40)] text-black",
  tag: "bg-secondary text-foreground",
  unknown: "bg-muted text-muted-foreground",
};

export function OpponentPanel({ game, street }: { game: GameApi; street: string }) {
  const { players, setPlayers, profiles, logAction, setNote, config } = game;
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const setAmt = (name: string, v: string) => setAmounts((a) => ({ ...a, [name]: v }));
  const amt = (name: string) => Math.max(0, Math.round(Number(amounts[name] || 0)));

  return (
    <div className="space-y-2">
      {players.map((p) => {
        const isHero = p.name === config.heroName;
        const prof = profiles[p.name];
        const read = prof ? readProfile(prof) : null;
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-lg border p-2.5 transition",
              isHero ? "border-primary/60 bg-primary/5" : "border-border bg-card",
              !p.inHand && "opacity-45"
            )}
          >
            <div className="flex items-center gap-2">
              <Input
                value={p.name}
                onChange={(e) =>
                  setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                }
                className="h-7 w-28 border-0 bg-transparent px-1 text-sm font-semibold focus-visible:ring-1"
              />
              <Input
                type="number"
                value={p.stack}
                onChange={(e) =>
                  setPlayers((ps) =>
                    ps.map((x) => (x.id === p.id ? { ...x, stack: Number(e.target.value) } : x))
                  )
                }
                className="h-7 w-20 text-xs"
              />
              {isHero ? (
                <Badge className="bg-primary text-primary-foreground">YOU</Badge>
              ) : read ? (
                <Badge className={cn("cursor-default text-[10px]", TAG_STYLE[read.tagClass])} title={read.blurb}>
                  {read.tag}
                </Badge>
              ) : null}
              <button
                onClick={() => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, inHand: !x.inHand } : x)))}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                {p.inHand ? "in" : "out"}
              </button>
            </div>

            {!isHero && read && read.tagClass !== "unknown" && (
              <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                <span>VPIP {(read.vpip * 100).toFixed(0)}%</span>
                <span>PFR {(read.pfr * 100).toFixed(0)}%</span>
                <span>AF {read.af.toFixed(1)}</span>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1">
              <Input
                type="number"
                placeholder="amt"
                value={amounts[p.name] ?? ""}
                onChange={(e) => setAmt(p.name, e.target.value)}
                className="h-7 w-16 text-xs"
                disabled={!p.inHand}
              />
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={!p.inHand}
                onClick={() => logAction(p.name, "fold", 0, street)}>Fold</Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={!p.inHand}
                onClick={() => logAction(p.name, "check", 0, street)}>Check</Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={!p.inHand}
                onClick={() => logAction(p.name, "call", 0, street)}>Call</Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={!p.inHand}
                onClick={() => logAction(p.name, "bet", amt(p.name), street)}>Bet</Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={!p.inHand}
                onClick={() => logAction(p.name, "raise", amt(p.name), street)}>Raise</Button>
            </div>

            {!isHero && (
              <div className="mt-1">
                {editing === p.name ? (
                  <Input
                    autoFocus
                    defaultValue={prof?.notes ?? ""}
                    onBlur={(e) => {
                      setNote(p.name, e.target.value);
                      setEditing(null);
                    }}
                    placeholder="note…"
                    className="h-6 text-[11px]"
                  />
                ) : (
                  <button
                    onClick={() => setEditing(p.name)}
                    className="text-[11px] italic text-muted-foreground hover:text-foreground"
                  >
                    {prof?.notes ? `“${prof.notes}”` : read?.blurb ?? "add note…"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
