import { createFileRoute, Link } from "@tanstack/react-router";
import { MultiTableHost } from "@/components/poker/MultiTableHost";
import { QuickLinksRail } from "@/components/QuickLinksRail";
import { PaladinWordmark } from "@/components/PaladinWordmark";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { TierComparison } from "@/components/poker/TierComparison";
import { useTier } from "@/lib/useTier";
import { ArrowLeft, Gamepad2, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
});

function AppPage() {
  const { tier, isPro } = useTier();

  return (
    <div className="matrix-bg min-h-dvh px-4 py-6 text-[17px] md:text-[19px] leading-relaxed">
      <QuickLinksRail />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <Link to="/demo" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-gold">
            <Gamepad2 className="h-4 w-4" /> Simulator
          </Link>
          <div className="flex-1 text-center">
            <PaladinWordmark size="md" subtitle={`Your personal poker coach · ${isPro ? "Pro" : "Standard"}`} />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pocket/install" className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Smartphone className="h-4 w-4" /> Mobile screen
            </Link>
            <Link to="/portal" className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" /> Portal
            </Link>
          </div>
        </header>

        <MultiTableHost tier={tier} />

        <TierComparison />
        <EducationalDisclaimer />
      </div>
    </div>
  );
}
