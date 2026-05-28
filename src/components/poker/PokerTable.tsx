import { useMemo, useState } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { readProfile, actionRead } from "@/lib/poker/strategy";
import type { ActionType, OpponentProfile } from "@/lib/poker/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TAG_STYLE: Record<string, string> = {
  shark: "bg-[oklch(0.5_0.18_300)] text-white",
  station: "bg-[oklch(0.6_0.16_145)] text-black",
  maniac: "bg-[oklch(0.58_0.22_27)] text-white",
  rock: "bg-[oklch(0.4_0.02_160)] text-foreground",
  lag: "bg-[oklch(0.7_0.18_300)] text-black",
  tag: "bg-secondary text-foreground",
  unknown: "bg-muted text-muted-foreground",
};

const ACTION_STYLE: Record<ActionType, string> = {
  fold: "bg-[oklch(0.35_0.02_160)] text-muted-foreground",
  check: "bg-secondary text-foreground",
  call: "bg-[oklch(0.8_0.14_95)] text-black",
  bet: "bg-[oklch(0.84_0.21_150)] text-black",
  raise: "bg-[oklch(0.7_0.18_300)] text-black",
  allin: "bg-[oklch(0.58_0.22_27)] text-white",
};

const BLANK: OpponentProfile = {
  name: "", hands: 0, vpipHands: 0, pfrHands: 0, aggressive: 0, passive: 0, folds: 0, notes: "",
};

function ellipse(i: number, n: number) {
  // i=0 sits at bottom-center (hero), rest spread clockwise around the oval
  const theta = Math.PI / 2 + (i / n) * Math.PI * 2;
  return {
    left: 50 + 41 * Math.cos(theta),
    top: 50 + 39 * Math.sin(theta),
  };
}

export function PokerTable({ game, street }: { game: GameApi; street: string }) {
  const { players, setPlayers, profiles, liveSeats, dealerSeat, logAction, setNote, config, board, pot } = game;

  // order players so hero is index 0 (bottom)
  const ordered = useMemo(() => {
    const heroIdx = players.findIndex((p) => p.name === config.heroName);
    if (heroIdx <= 0) return players;
    return [...players.slice(heroIdx), ...players.slice(0, heroIdx)];
  }, [players, config.heroName]);

  return (
    <div className="relative w-full">
      <div className="felt-surface relative mx-auto aspect-[16/10] w-full max-w-2xl rounded-[44%] border border-matrix/20">
        {/* center: board + pot */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex gap-1">
            {board.length === 0 ? (
              <span className="font-data text-xs uppercase tracking-widest text-muted-foreground">{street}</span>
            ) : (
              board.map((c, i) => (
                <span
                  key={`${c.r}-${c.s}`}
                  className={cn(
                    "card-flip-in flex h-10 w-7 items-center justify-center rounded border border-matrix/40 bg-background font-data text-sm font-bold",
                    c.s === 1 || c.s === 2 ? "text-[oklch(0.7_0.2_25)]" : "text-foreground"
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {["", "", "", ""][0]}
                  {["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"][14 - c.r]}
                  {["♣", "♦", "♥", "♠"][c.s]}
                </span>
              ))
            )}
          </div>
          <div className="rounded-full bg-background/70 px-3 py-0.5 font-data text-xs text-matrix">
            POT {pot.toLocaleString()}
          </div>
        </div>

        {ordered.map((p, i) => {
          const live = liveSeats[p.id + 1];
          const prof = profiles[p.name];
          const read = prof ? readProfile(prof) : null;
          const isHero = p.name === config.heroName;
          const pos = ellipse(i, ordered.length);
          const why = read && live?.action ? actionRead(read, live.action, live.betAmount ?? 0, pot) : null;

          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex w-24 flex-col items-center gap-0.5 rounded-lg border bg-card/90 px-2 py-1.5 backdrop-blur transition hover:border-matrix",
                      isHero ? "border-matrix glow-matrix" : "border-border",
                      !p.inHand && "opacity-40"
                    )}
                  >
                    <div className="flex w-full items-center justify-center gap-1">
                      {dealerSeat === p.id + 1 && (
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-[8px] font-bold text-background">D</span>
                      )}
                      <span className="truncate text-[11px] font-semibold">{p.name}</span>
                    </div>
                    <span className="font-data text-[11px] text-matrix">{p.stack.toLocaleString()}</span>
                    {live?.action ? (
                      <span className={cn("rounded px-1.5 text-[9px] font-bold uppercase", ACTION_STYLE[live.action])}>
                        {live.action}{live.betAmount ? ` ${live.betAmount}` : ""}
                      </span>
                    ) : isHero ? (
                      <Badge className="h-4 bg-matrix px-1.5 text-[8px] text-black">YOU</Badge>
                    ) : read ? (
                      <span className={cn("rounded px-1.5 text-[9px] font-semibold", TAG_STYLE[read.tagClass])}>{read.tag}</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">—</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-2" align="center">
                  <div className="flex items-center gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                      className="h-7 flex-1 text-sm font-semibold"
                    />
                    <Input
                      type="number"
                      value={p.stack}
                      onChange={(e) => setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, stack: Number(e.target.value) } : x)))}
                      className="h-7 w-20 font-data text-xs"
                    />
                  </div>

                  {!isHero && read && read.tagClass !== "unknown" && (
                    <div className="grid grid-cols-3 gap-1 rounded bg-secondary/40 p-1.5 text-center font-data text-[10px] text-muted-foreground">
                      <span>VPIP {(read.vpip * 100).toFixed(0)}</span>
                      <span>PFR {(read.pfr * 100).toFixed(0)}</span>
                      <span>AF {read.af.toFixed(1)}</span>
                    </div>
                  )}

                  {why && (
                    <p className={cn(
                      "rounded p-1.5 text-[11px]",
                      why.bluffRisk === "high" ? "bg-destructive/15 text-foreground" : "bg-secondary/40 text-muted-foreground"
                    )}>
                      {why.text}
                    </p>
                  )}
                  {!why && read && <p className="text-[11px] italic text-muted-foreground">{read.blurb}</p>}

                  {!isHero && (
                    <>
                      <ActionRow onAct={(a, amt) => logAction(p.name, a, amt, street)} disabled={!p.inHand} />
                      <NoteField defaultValue={prof?.notes ?? ""} onSave={(v) => setNote(p.name, v)} />
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionRow({ onAct, disabled }: { onAct: (a: ActionType, amt: number) => void; disabled: boolean }) {
  const [amt, setAmt] = useState("");
  const n = Math.max(0, Math.round(Number(amt) || 0));
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Input type="number" placeholder="amt" value={amt} onChange={(e) => setAmt(e.target.value)} className="h-7 w-14 font-data text-xs" disabled={disabled} />
      {(["fold", "check", "call", "bet", "raise"] as ActionType[]).map((a) => (
        <Button key={a} size="sm" variant="secondary" className="h-7 px-2 text-[11px] capitalize" disabled={disabled} onClick={() => onAct(a, n)}>
          {a}
        </Button>
      ))}
    </div>
  );
}

function NoteField({ defaultValue, onSave }: { defaultValue: string; onSave: (v: string) => void }) {
  return (
    <Input
      defaultValue={defaultValue}
      placeholder="note…"
      onBlur={(e) => onSave(e.target.value)}
      className="h-7 text-[11px]"
    />
  );
}
