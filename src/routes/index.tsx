import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGame } from "@/lib/poker/useGame";
import { cardKey } from "@/lib/poker/types";
import { GameSetup } from "@/components/poker/GameSetup";
import { BlindTimer } from "@/components/poker/BlindTimer";
import { CardPicker } from "@/components/poker/CardPicker";
import { PokerTable } from "@/components/poker/PokerTable";
import { Recommendation } from "@/components/poker/Recommendation";
import { ScreenShare } from "@/components/poker/ScreenShare";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poker Co-Pilot — Live Tournament Strategy Assistant" },
      { name: "description", content: "Real-time, mathematically optimal poker advice with Monte Carlo equity, opponent profiling, and screen-share table reading for Hold'em, Omaha and Stud." },
      { property: "og:title", content: "Poker Co-Pilot" },
      { property: "og:description", content: "Mathematically optimal betting advice and opponent profiling for live poker tournaments." },
    ],
  }),
  component: Index,
});

function Index() {
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
    <div className="matrix-bg min-h-screen px-3 py-4">
      <div className="relative z-10 mx-auto max-w-6xl space-y-4">
        <header>
          <h1 className="font-display text-xl font-black leading-none">
            POKER<span className="text-matrix"> CO-PILOT</span>
          </h1>
          <p className="font-data text-xs text-muted-foreground">{variant.label} · {street}</p>
        </header>


        {/* Centerpiece: live poker table + live reader, side by side */}
        <div className="grid gap-4 lg:grid-cols-2">
          <PokerTable game={game} street={street} />
          <ScreenShare game={game} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: your hand + blinds */}
          <div className="space-y-4">
            <BlindTimer game={game} />
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <CardPicker label="Your cards" cards={hero} max={variant.holeCount} disabledKeys={disabledKeys} onChange={setHero} />
              {variant.community && (
                <CardPicker label="Board" cards={board} max={variant.boardSize} disabledKeys={disabledKeys} onChange={setBoard} accent="muted" />
              )}
            </div>
          </div>

          {/* Right: math + what to do */}
          <div className="space-y-4">
            <Recommendation game={game} />
          </div>
        </div>
      </div>
    </div>
  );
}

