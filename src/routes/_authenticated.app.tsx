import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGame } from "@/lib/poker/useGame";
import { cardKey } from "@/lib/poker/types";
import { GameSetup } from "@/components/poker/GameSetup";
import { CardPicker } from "@/components/poker/CardPicker";
import { PokerTable } from "@/components/poker/PokerTable";
import { Recommendation } from "@/components/poker/Recommendation";
import { GoLivePanel, useSharedShare } from "@/components/poker/GoLivePanel";
import { ScanPanel } from "@/components/poker/ScanPanel";
import { AllInOneEditor } from "@/components/poker/AllInOneEditor";
import { TierComparison } from "@/components/poker/TierComparison";
import { QuickLinksRail } from "@/components/QuickLinksRail";
import { PaladinWordmark } from "@/components/PaladinWordmark";
import { ArrowLeft, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
});

function AppPage() {
  const game = useGame();
  const { started, start, variant, hero, setHero, board, setBoard } = game;
  const shared = useSharedShare(game);
  const { user } = useAuth();
  const [tier, setTier] = useState<"standard" | "pro">("standard");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.tier === "pro") setTier("pro");
    })();
  }, [user]);

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
    <div className="matrix-bg min-h-dvh px-4 py-6 text-[17px] md:text-[19px] leading-relaxed">
      <QuickLinksRail />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <Link to="/demo" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-gold">
            <Gamepad2 className="h-4 w-4" /> Simulator
          </Link>
          <div className="flex-1 text-center">
            <PaladinWordmark size="md" subtitle={`${variant.label} · ${street} · ${tier === "pro" ? "Pro" : "Standard"}`} />
          </div>
          <Link to="/portal" className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" /> Portal
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: table → scan → editor */}
          <div className="space-y-6">
            <PokerTable game={game} street={street} />
            <ScanPanel shared={shared} tier={tier} />
            <AllInOneEditor game={game} />
          </div>

          {/* RIGHT: GO LIVE → your cards → Paladin Says → board */}
          <div className="space-y-6">
            <GoLivePanel game={game} tier={tier} shared={shared} />
            <div className="rounded-xl border border-border bg-card p-5">
              <CardPicker label="Your cards" cards={hero} max={variant.holeCount} disabledKeys={disabledKeys} onChange={setHero} />
            </div>
            <Recommendation game={game} />
            {variant.community && (
              <div className="rounded-xl border border-border bg-card p-5">
                <CardPicker label="Board" cards={board} max={variant.boardSize} disabledKeys={disabledKeys} onChange={setBoard} accent="muted" />
              </div>
            )}
          </div>
        </div>

        <TierComparison />
      </div>
    </div>
  );
}
