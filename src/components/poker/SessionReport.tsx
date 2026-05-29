import { useMemo } from "react";
import type { GameApi } from "@/lib/poker/useGame";
import { analyzeSession, type SessionReport as Report } from "@/lib/poker/leakFinder";
import { cardLabel } from "@/lib/poker/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { AlertTriangle, TrendingUp, Award, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  game: GameApi;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEV: Record<string, string> = {
  high: "border-destructive/50 bg-destructive/10 text-foreground",
  medium: "border-gold/50 bg-gold/10 text-foreground",
  low: "border-border bg-secondary/40 text-foreground",
};

export function SessionReport({ game, open, onOpenChange }: Props) {
  const report: Report | null = useMemo(() => {
    if (!open) return null;
    return analyzeSession(game.handHistory);
  }, [open, game.handHistory]);

  const handleClose = () => onOpenChange(false);
  const handleEnd = () => {
    game.endSession();
    onOpenChange(false);
  };
  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto border-wizard/40 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black uppercase tracking-wide">
            Paladin Session Report
          </DialogTitle>
        </DialogHeader>

        {!report || report.totalHands === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Award className="mx-auto h-10 w-10 text-gold/60" />
            <p className="mt-3 font-display text-lg">No hands recorded yet.</p>
            <p className="mt-1 text-sm">Play a few hands with Paladin watching, then end the session to see your leaks.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Headline */}
            <div className="rounded-xl border border-wizard/40 bg-wizard/5 p-4 text-center">
              <div className="font-data text-[10px] uppercase tracking-[0.3em] text-wizard">Session summary</div>
              <div className="mt-1 font-display text-3xl font-black">
                {report.totalHands} hands · {report.leaks.length} leak{report.leaks.length === 1 ? "" : "s"} found
              </div>
              {report.estimatedEvLost < 0 && (
                <div className="mt-1 text-sm text-destructive">
                  Estimated EV left on the table: <span className="font-bold">{report.estimatedEvLost}</span>
                </div>
              )}
            </div>

            {/* Radar */}
            <RadarChart stats={report.stats} />

            {/* Leaks */}
            {report.leaks.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gold" /> Leaks detected
                </h3>
                <div className="space-y-2">
                  {report.leaks.map((l) => (
                    <div key={l.id} className={cn("rounded-lg border p-3", SEV[l.severity])}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold">{l.title}</div>
                        <div className="font-data text-[10px] uppercase tracking-wider opacity-70">{l.severity}</div>
                      </div>
                      <p className="mt-1 text-sm">{l.detail}</p>
                      {l.estEv < 0 && (
                        <div className="mt-1 font-data text-xs text-destructive">~{l.estEv} EV</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top expensive hands */}
            {report.topHands.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-wizard" /> Top 5 most expensive spots
                </h3>
                <div className="space-y-2">
                  {report.topHands.map((h, i) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-data text-xs uppercase tracking-wider text-muted-foreground">
                          {h.street} · pot {h.pot}
                        </div>
                        <div className={cn(
                          "rounded px-2 py-0.5 font-data text-[10px] font-bold uppercase",
                          h.verdict === "Fold" ? "bg-muted text-muted-foreground" :
                          h.verdict === "Call" || h.verdict === "Check" ? "bg-gold/20 text-gold" :
                          "bg-wizard/30 text-wizard"
                        )}>
                          Paladin: {h.verdict}{h.suggestedSize ? ` ${h.suggestedSize}` : ""}
                        </div>
                      </div>
                      <div className="mt-1 font-data">
                        {h.hero.map((c) => cardLabel(c)).join(" ")}
                        <span className="mx-2 text-muted-foreground">|</span>
                        {h.board.length ? h.board.map((c) => cardLabel(c)).join(" ") : <span className="text-muted-foreground">—</span>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Equity {(h.equity * 100).toFixed(0)}% · Need {(h.requiredEquity * 100).toFixed(0)}% · EV {h.evCall >= 0 ? "+" : ""}{h.evCall.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="secondary" className="flex-1 gap-2">
                <Printer className="h-4 w-4" /> Print / Save
              </Button>
              <Button onClick={handleEnd} className="flex-1 wizard-gradient text-white font-bold">
                End session & reset
              </Button>
              <Button onClick={handleClose} variant="ghost">Close</Button>
            </div>

            <EducationalDisclaimer />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RadarChart({ stats }: { stats: Report["stats"] }) {
  const axes = [
    { label: "Aggression", v: stats.aggression },
    { label: "Fold Freq", v: stats.foldFrequency },
    { label: "Value Capture", v: stats.valueCapture },
    { label: "Bluff Discipline", v: stats.bluffDiscipline },
    { label: "Preflop Tightness", v: stats.preflopTightness },
  ];
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };
  const poly = axes.map((ax, i) => pt(i, ax.v).join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((g) =>
    axes.map((_, i) => pt(i, g).join(",")).join(" ")
  );

  return (
    <div className="flex items-center justify-center rounded-xl border border-border bg-secondary/20 p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((p, i) => (
          <polygon key={i} points={p} fill="none" stroke="oklch(0.5 0.02 160 / 0.3)" strokeWidth="0.5" />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(0.5 0.02 160 / 0.3)" strokeWidth="0.5" />;
        })}
        <polygon points={poly} fill="oklch(0.55 0.22 295 / 0.35)" stroke="oklch(0.7 0.2 295)" strokeWidth="2" />
        {axes.map((ax, i) => {
          const [x, y] = pt(i, 1.18);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="currentColor" className="font-data uppercase">
              {ax.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
