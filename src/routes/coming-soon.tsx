import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Hourglass, Sword } from "lucide-react";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "Coming Soon — Poker Paladin" },
      { name: "description", content: "The Paladin's apprentices are sharpening their blades. This feature is on the way." },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <main className="matrix-bg min-h-dvh flex items-center justify-center px-4">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/60 bg-gold/10 text-gold animate-pulse">
          <Hourglass className="h-8 w-8" />
        </div>
        <p className="mt-6 font-data text-[11px] uppercase tracking-[0.4em] text-gold flex items-center justify-center gap-2">
          <Sparkles className="h-3 w-3" /> Forging in the holy forge
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl font-black">
          The Paladin is <span className="text-wizard">summoning</span> this one.
        </h1>
        <p className="mt-4 text-sm md:text-base text-muted-foreground">
          We hear you — you can't wait. Neither can we. This relic is being enchanted as we speak.
          Drop your sword for a moment, refill your goblet, and we'll send a raven the second it's battle-ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/portal"><Button size="lg" className="gap-2"><Sword className="h-4 w-4" /> Back to portal</Button></Link>
          <Link to="/app"><Button size="lg" variant="secondary">Launch Paladin instead</Button></Link>
        </div>
        <p className="mt-8 font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Patience, Knight — the realm rewards those who wait.
        </p>
      </div>
    </main>
  );
}
