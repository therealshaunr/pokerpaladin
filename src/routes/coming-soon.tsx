import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Hourglass, Sword, Smartphone, QrCode, ScanLine } from "lucide-react";

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
    <main className="matrix-bg min-h-dvh px-4 py-12">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
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
        </p>

        {/* Mobile companion concept */}
        <section className="mt-10 rounded-2xl border border-gold/30 bg-card p-6 text-left shadow-[0_0_60px_-20px_rgba(212,175,76,0.4)]">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl font-black uppercase tracking-wide">The Paladin Pocket · how it'll work</h2>
          </div>
          <ol className="mt-4 space-y-3 text-sm text-foreground/90">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-data text-[11px] font-bold text-gold">1</span>
              <span>From the desktop app you tap <span className="text-gold font-semibold">Pair phone</span> — we generate a 10-minute <QrCode className="inline h-3 w-3 align-baseline" /> QR + 6-digit code tied to your active session.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-data text-[11px] font-bold text-gold">2</span>
              <span>You scan the code on your phone. Paladin Pocket opens a stripped-down read-only view of <span className="text-wizard font-semibold">Paladin Says</span> — decision, equity, pot odds, EV, and one-line rationale.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-data text-[11px] font-bold text-gold">3</span>
              <span>Verdicts stream over realtime — every time the desktop recalculates, your phone updates within a beat. Safe-to-glance, screen-off-friendly, haptic on each new verdict.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-data text-[11px] font-bold text-gold">4</span>
              <span>Optional <ScanLine className="inline h-3 w-3 align-baseline" /> <span className="text-matrix font-semibold">phone-as-camera</span> mode — point your phone at a live table; the Paladin reads the screen the same way it reads your desktop share.</span>
            </li>
          </ol>
          <p className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            No new app store install — it's a PWA. Add to home screen, launch full-screen, done. Pairing is bound to your account + session; codes self-destruct after 10 minutes or one claim.
          </p>
        </section>

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
