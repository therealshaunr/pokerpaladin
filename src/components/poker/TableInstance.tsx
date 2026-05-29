import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/poker/useGame";
import { cardKey } from "@/lib/poker/types";
import { GameSetup } from "@/components/poker/GameSetup";
import { CardPicker } from "@/components/poker/CardPicker";
import { PokerTable } from "@/components/poker/PokerTable";
import { Recommendation } from "@/components/poker/Recommendation";
import { GoLivePanel, useSharedShare } from "@/components/poker/GoLivePanel";
import { ScanPanel } from "@/components/poker/ScanPanel";
import { AllInOneEditor } from "@/components/poker/AllInOneEditor";
import { TendencyCallout } from "@/components/poker/TendencyCallout";
import { SessionReport } from "@/components/poker/SessionReport";
import { UpgradeToProDialog } from "@/components/UpgradeToProDialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Lock } from "lucide-react";
import type { Tier } from "@/lib/useTier";

interface Props {
  slotId: string;
  tier: Tier;
  isActive: boolean;
  onMeta: (pot: number, live: boolean) => void;
}

export function TableInstance({ tier, isActive, onMeta }: Props) {
  const game = useGame();
  const { started, start, variant, hero, setHero, board, setBoard, pot } = game;
  const shared = useSharedShare(game);
  const [reportOpen, setReportOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Bubble pot + live status up to host
  useEffect(() => { onMeta(pot, shared.sharing && !shared.standby && !shared.paused); }, [pot, shared.sharing, shared.standby, shared.paused, onMeta]);

  // Pause auto-scan on inactive tables to save credits
  useEffect(() => {
    if (!started) return;
    shared.setPaused(!isActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, started]);

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

  const isPro = tier === "pro";
  const activeNames = game.activeOpponents.map((p) => p.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/50 p-2">
        <div className="font-data text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {variant.label} · {street} · {game.handHistory.length} hands recorded
        </div>
        <Button
          size="sm"
          variant={isPro ? "secondary" : "outline"}
          onClick={() => isPro ? setReportOpen(true) : setUpgradeOpen(true)}
          className="gap-2"
        >
          {isPro ? <ClipboardList className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Session Review{!isPro && " · Pro"}
        </Button>
      </div>

      <TendencyCallout
        profiles={game.profiles}
        activeNames={activeNames}
        isPro={isPro}
        onUpgrade={() => setUpgradeOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PokerTable game={game} street={street} />
          <ScanPanel shared={shared} tier={tier} />
          <AllInOneEditor game={game} />
        </div>

        <div className="space-y-6">
          <GoLivePanel game={game} tier={tier} shared={shared} />
          <div className="rounded-xl border border-border bg-card p-5">
            <CardPicker label="Your cards" cards={hero} max={variant.holeCount} disabledKeys={disabledKeys} onChange={setHero} />
          </div>
          <Recommendation game={game} tier={tier} onUpgrade={() => setUpgradeOpen(true)} />
          {variant.community && (
            <div className="rounded-xl border border-border bg-card p-5">
              <CardPicker label="Board" cards={board} max={variant.boardSize} disabledKeys={disabledKeys} onChange={setBoard} accent="muted" />
            </div>
          )}
        </div>
      </div>

      <SessionReport game={game} open={reportOpen} onOpenChange={setReportOpen} />
      <UpgradeToProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
