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

// Full hand played out street-by-street. Each phase shows what Paladin would
// be computing in real time — equity shifts as new board cards drop.
type Phase = {
  street: "Preflop" | "Flop" | "Turn" | "River";
  board: string[];          // cumulative board
  pot: number;
  toCall: number;
  stack: number;
  opps: number;
  equity: number;
  potOdds: number;
  ev: string;
  decision: "RAISE" | "CALL" | "CHECK" | "BET" | "FOLD";
  size: string;
  rationale: string[];
};

const HERO = ["A♠", "A♥"];

const PHASES: Phase[] = [
  {
    street: "Preflop",
    board: [],
    pot: 35, toCall: 25, stack: 1500, opps: 4,
    equity: 56.2, potOdds: 41.7, ev: "+$22.4",
    decision: "RAISE", size: "$110 (3.7× BB)",
    rationale: [
      "Pocket aces — best preflop hand in NLHE. Always raise for value, never limp.",
      "4 callers already in: raise big to thin the field and protect your equity.",
      "3.7× BB sizing isolates the strongest range while still getting calls from broadway and pocket pairs.",
    ],
  },
  {
    street: "Flop",
    board: ["K♠", "7♦", "2♣"],
    pot: 285, toCall: 0, stack: 1390, opps: 2,
    equity: 87.4, potOdds: 0, ev: "+$58.7",
    decision: "BET", size: "$180 (≈63% pot)",
    rationale: [
      "Dry, low-coordination board — your overpair crushes every reasonable calling range.",
      "Two opponents left: c-bet for value and to deny equity to backdoor draws.",
      "63% pot sizing keeps Kx hands in while charging draws the maximum.",
    ],
  },
  {
    street: "Turn",
    board: ["K♠", "7♦", "2♣", "9♥"],
    pot: 645, toCall: 220, stack: 1210, opps: 1,
    equity: 78.9, potOdds: 25.4, ev: "+$94.1",
    decision: "RAISE", size: "$680 (≈1.05× pot)",
    rationale: [
      "Brick turn — no flush, no straight completed. Your aces are still way ahead.",
      "Villain's lead-bet looks like a Kx slowplay or a set of 7s. You beat both at this frequency.",
      "Raise to ≈1× pot for max value before a scary river kills your action.",
    ],
  },
  {
    street: "River",
    board: ["K♠", "7♦", "2♣", "9♥", "5♠"],
    pot: 2005, toCall: 0, stack: 530, opps: 1,
    equity: 92.6, potOdds: 0, ev: "+$487.0",
    decision: "BET", size: "$530 (ALL-IN · 26% pot)",
    rationale: [
      "Blank river — no flush, no straight. Your overpair value only grows.",
      "Pot is now $2,005 with $530 behind: jam for max value, never check back.",
      "Villain is priced in at 6.4-to-1 with any Kx or pocket pair — you get called by everything worse.",
    ],
  },
];

function useHandSequence() {
  // step counter drives reveal of phases over time
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [boardCardsShown, setBoardCardsShown] = useState(0); // 0..5
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setPhaseIdx(0);
    setBoardCardsShown(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 0: Preflop (no board)
    // Phase 1: Flop @ 2.0s, board cards 1,2,3 stagger
    timers.push(setTimeout(() => setPhaseIdx(1), 2200));
    timers.push(setTimeout(() => setBoardCardsShown(1), 2200));
    timers.push(setTimeout(() => setBoardCardsShown(2), 2500));
    timers.push(setTimeout(() => setBoardCardsShown(3), 2800));

    // Phase 2: Turn
    timers.push(setTimeout(() => setPhaseIdx(2), 5500));
    timers.push(setTimeout(() => setBoardCardsShown(4), 5500));

    // Phase 3: River
    timers.push(setTimeout(() => setPhaseIdx(3), 8200));
    timers.push(setTimeout(() => setBoardCardsShown(5), 8200));

    return () => timers.forEach(clearTimeout);
  }, [tick]);

  return { phaseIdx, boardCardsShown, replay: () => setTick((t) => t + 1) };
}

function useCountUp(target: number, durationMs = 700, decimals = 1) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const startVal = value;
    const startTs = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(startVal + (target - startVal) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return value.toFixed(decimals);
}

function Demo() {
  const { phaseIdx, boardCardsShown, replay } = useHandSequence();
  const phase = PHASES[phaseIdx];
  const equity = useCountUp(phase.equity, 800, 1);
  const potOdds = useCountUp(phase.potOdds, 600, 1);

  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <header className="py-10 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Live Demo · No signup</p>
          <h1 className="mt-3 font-display text-3xl font-black md:text-5xl">Watch the <span className="text-wizard">Paladin</span> work.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">A full hand, played street by street. The live product reads <em>your</em> screen the same way — recalculating equity, pot odds, and EV every time a new card hits the felt.</p>
          <button onClick={replay} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 font-data text-[11px] font-bold uppercase tracking-wider text-gold hover:bg-gold/20 transition">
            <RotateCcw className="h-3 w-3" /> Replay hand
          </button>
        </header>

        {/* STREET INDICATOR */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {PHASES.map((p, i) => (
            <div key={p.street} className={`flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.25em] transition ${i === phaseIdx ? "text-gold" : i < phaseIdx ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${i === phaseIdx ? "bg-gold animate-pulse" : i < phaseIdx ? "bg-muted-foreground" : "bg-muted-foreground/30"}`} />
              {p.street}
              {i < PHASES.length - 1 && <span className="ml-2 text-muted-foreground/30">›</span>}
            </div>
          ))}
        </div>

        {/* TABLE */}
        <section className="felt-surface arcane-border p-6 md:p-10">
          <div className="text-center">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Board · {phase.street}</div>
            <div className="mt-2 flex justify-center gap-2 min-h-[112px] md:min-h-[128px]">
              {["", "", "", "", ""].map((_, i) => {
                const card = phase.board[i];
                const visible = i < boardCardsShown && !!card;
                return <DealtCard key={`b-${i}`} c={card ?? "?"} visible={visible} big />;
              })}
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your Hand</div>
            <div className="mt-2 flex justify-center gap-2 min-h-[112px] md:min-h-[128px]">
              {HERO.map((c, i) => <DealtCard key={`h-${i}`} c={c} visible={true} big />)}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 font-data text-xs text-muted-foreground">
            <Stat label="Pot" value={`$${phase.pot}`} />
            <Stat label="To Call" value={phase.toCall > 0 ? `$${phase.toCall}` : "—"} />
            <Stat label="Stack" value={`$${phase.stack}`} />
            <Stat label="vs" value={`${phase.opps} opp${phase.opps > 1 ? "s" : ""}`} />
          </div>
        </section>

        {/* VERDICT */}
        <section key={phaseIdx} className="arcane-border glow-wizard mt-6 p-6 md:p-8 animate-fade-in">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.3em] text-gold">
                <Sparkles className="h-3 w-3 animate-pulse" /> Paladin says · {phase.street}
              </div>
              <div className="mt-2 font-display text-5xl font-black text-wizard md:text-7xl">{phase.decision}</div>
              <div className="mt-1 font-data text-sm text-gold">{phase.size}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Metric icon={Eye} label="Equity" value={`${equity}%`} />
              <Metric icon={Coins} label="Pot odds" value={phase.toCall > 0 ? `${potOdds}%` : "—"} />
              <Metric icon={TrendingUp} label="EV" value={phase.ev} />
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Why</div>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {phase.rationale.map((r, i) => (
                <li key={`${phaseIdx}-${i}`} className="flex gap-2 animate-fade-in" style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
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
      className={`flex flex-col items-center justify-center rounded-md border font-display font-black shadow-xl transition-all duration-500 ease-out ${big ? "h-24 w-16 text-3xl md:h-28 md:w-20 md:text-4xl" : "h-16 w-12 text-xl"} ${visible ? `border-border bg-white opacity-100 translate-y-0 rotate-0 scale-100 ${isRed ? "text-red-600" : "text-black"}` : "border-border/30 bg-card/20 opacity-30 scale-90"}`}
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
