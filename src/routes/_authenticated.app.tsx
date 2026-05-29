import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGame } from "@/lib/poker/useGame";
import { cardKey } from "@/lib/poker/types";
import { GameSetup } from "@/components/poker/GameSetup";
import { BlindTimer } from "@/components/poker/BlindTimer";
import { CardPicker } from "@/components/poker/CardPicker";
import { PokerTable } from "@/components/poker/PokerTable";
import { Recommendation } from "@/components/poker/Recommendation";
import { ScreenShare } from "@/components/poker/ScreenShare";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
});

function AppPage() {
  const game = useGame();
  const { started, start, variant, hero, setHero, board, setBoard } = game;

  const street = useMemo(() => {
    if (!variant.community) return board.length ? "late" : "early";
    if (board.length === 0) return "preflop";
    if (board.length <= 3) return "flop";
    if (board.length === 4) return "turn";
    return "river";
  }, [board.length, variant.community]);

  const disabledKeys = useMemo(() => {
    const s = new Set<string>();
    for (const c of [...hero, ...board]) s.add(cardKey(c));
    return s;
  }, [hero, board]);

  if (!started) return <GameSetup onStart={start} />;

  return (
    <div className="matrix-bg min-h-dvh px-3 py-4">
      <div className="relative z-10 mx-auto max-w-6xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-black leading-none">
              POKER<span className="text-matrix"> CO-PILOT</span>
            </h1>
            <p className="font-data text-xs text-muted-foreground">{variant.label} · {street}</p>
          </div>
          <Link to="/portal" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Portal
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <PokerTable game={game} street={street} />
          <ScreenShare game={game} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <BlindTimer game={game} />
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <CardPicker label="Your cards" cards={hero} max={variant.holeCount} disabledKeys={disabledKeys} onChange={setHero} />
              {variant.community && (
                <CardPicker label="Board" cards={board} max={variant.boardSize} disabledKeys={disabledKeys} onChange={setBoard} accent="muted" />
              )}
            </div>
          </div>
          <div className="space-y-4">
            <Recommendation game={game} />
          </div>
        </div>
      </div>
    </div>
  );
}
