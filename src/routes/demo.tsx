import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteNav, SiteFooter } from "./index";
import { Sparkles, Eye, TrendingUp, Coins, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — Poker Paladin" },
      { name: "description", content: "See exactly what Poker Paladin shows you mid-hand. A frozen sample hand with the full analyzer output — no signup needed." },
      { property: "og:title", content: "Try Poker Paladin (no signup)" },
      { property: "og:description", content: "A frozen sample hand with full analyzer output." },
    ],
  }),
  component: Demo,
});

// Static, frozen sample for marketing — does NOT call any API.
const SAMPLE = {
  hero: ["A♠", "A♥"],
  board: ["K♠", "7♦", "2♣"],
  pot: 145,
  toCall: 65,
  stack: 1280,
  opps: 2,
  equity: 87.4,
  potOdds: 31.0,
  ev: "+$58.7",
  decision: "RAISE",
  size: "$180 (≈1.25× pot)",
  rationale: [
    "Pocket aces on a dry, low-coordination board — you are crushing every reasonable calling range.",
    "Your equity vs. 2 random opponents > 80%; raising for value is mandatory.",
    "Sizing 1.25× pot punishes weak top-pair, flush draws, and broadway gutshots without folding them out.",
    "Avoid slow-playing: two opponents see one of seven spades/clubs/diamonds hit the turn ~36% of the time.",
  ],
};

function useDealAnimation() {
  // step: 0 = nothing, 1-2 = hero cards, 3-5 = flop, 6 = stats, 7 = verdict
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0); // for replay
  useEffect(() => {
    setStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = [350, 700, 1300, 1650, 2000, 2500, 3100];
    schedule.forEach((ms, i) => {
      timers.push(setTimeout(() => setStep(i + 1), ms));
    });
    return () => timers.forEach(clearTimeout);
  }, [tick]);
  return { step, replay: () => setTick((t) => t + 1) };
}

function useCountUp(target: number, start: boolean, durationMs = 900, decimals = 1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) { setValue(0); return; }
    const startTs = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, durationMs]);
  return value.toFixed(decimals);
}

function Demo() {
  const { step, replay } = useDealAnimation();
  const equity = useCountUp(SAMPLE.equity, step >= 6, 900, 1);
  const potOdds = useCountUp(SAMPLE.potOdds, step >= 6, 900, 1);

  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <header className="py-10 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Live Demo · No signup</p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-5xl">Watch the <span className="text-wizard">Paladin</span> work.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">A real hand, played out in front of you. The live product reads <em>your</em> screen the same way — in real time.</p>
          <button onClick={replay} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 font-data text-[11px] font-bold uppercase tracking-wider text-gold hover:bg-gold/20 transition">
            <RotateCcw className="h-3 w-3" /> Replay hand
          </button>
        </header>

        {/* TABLE */}
        <section className="felt-surface arcane-border p-6 md:p-10">
          <div className="text-center">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Board</div>
            <div className="mt-2 flex justify-center gap-2 min-h-[112px] md:min-h-[128px]">
              {SAMPLE.board.map((c, i) => <DealtCard key={`b-${c}-${i}`} c={c} visible={step >= 3 + i} big />)}
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your Hand</div>
            <div className="mt-2 flex justify-center gap-2 min-h-[112px] md:min-h-[128px]">
              {SAMPLE.hero.map((c, i) => <DealtCard key={`h-${c}-${i}`} c={c} visible={step >= 1 + i} big />)}
            </div>
          </div>
          <div className={`mt-8 flex flex-wrap justify-center gap-4 font-data text-xs text-muted-foreground transition-all duration-500 ${step >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <Stat label="Pot" value={`$${SAMPLE.pot}`} />
            <Stat label="To Call" value={`$${SAMPLE.toCall}`} />
            <Stat label="Stack" value={`$${SAMPLE.stack}`} />
            <Stat label="vs" value={`${SAMPLE.opps} opp`} />
          </div>
        </section>

        {/* VERDICT */}
        <section className={`arcane-border glow-wizard mt-6 p-6 md:p-8 transition-all duration-700 ${step >= 7 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98]"}`}>
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.3em] text-gold">
                <Sparkles className="h-3 w-3 animate-pulse" /> Paladin says
              </div>
              <div className="mt-2 font-display text-5xl font-black text-wizard md:text-7xl">{SAMPLE.decision}</div>
              <div className="mt-1 font-data text-sm text-gold">{SAMPLE.size}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Metric icon={Eye} label="Equity" value={`${equity}%`} />
              <Metric icon={Coins} label="Pot odds" value={`${potOdds}%`} />
              <Metric icon={TrendingUp} label="EV" value={SAMPLE.ev} />
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Why</div>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {SAMPLE.rationale.map((r, i) => (
                <li key={i} className="flex gap-2 animate-fade-in" style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
                  <span className="text-gold">›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="my-10 text-center">
          <p className="text-sm text-muted-foreground">Ready to point it at your own table?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/pricing"><Button size="lg" className="font-bold">See pricing →</Button></Link>
            <Link to="/login" search={{ redirect: "/portal" }}><Button size="lg" variant="secondary">Create account</Button></Link>
          </div>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

function DealtCard({ c, big, visible }: { c: string; big?: boolean; visible: boolean }) {
  const isRed = c.includes("♥") || c.includes("♦");
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border border-border bg-white font-display font-black shadow-xl transition-all duration-500 ease-out ${big ? "h-24 w-16 text-3xl md:h-28 md:w-20 md:text-4xl" : "h-16 w-12 text-xl"} ${isRed ? "text-red-600" : "text-black"} ${visible ? "opacity-100 translate-y-0 rotate-0 scale-100" : "opacity-0 -translate-y-8 -rotate-12 scale-75"}`}
    >
      {visible ? c : ""}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>{" "}
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-gold" />
      <div className="mt-1 font-data text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-black text-foreground">{value}</div>
    </div>
  );
}
