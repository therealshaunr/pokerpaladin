import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteNav, SiteFooter } from "./index";
import { Spade, Diamond, Heart, Club, Sparkles } from "lucide-react";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "How to Play — Poker Paladin" },
      { name: "description", content: "Brand-new to poker? Plain-English primers for No-Limit Hold'em, Pot-Limit Omaha, 5-Card PLO, and Seven-Card Stud — the basics in 60 seconds each." },
      { property: "og:title", content: "How to Play Poker — the basics" },
      { property: "og:description", content: "Hold'em, Omaha, Stud — the rules without the jargon." },
    ],
  }),
  component: HowToPlay,
});

const GAMES = [
  {
    icon: Spade,
    name: "No-Limit Hold'em",
    when: "Most common game online and in casinos.",
    basics: [
      "You get 2 private \"hole cards\".",
      "Five community cards are dealt face-up in the middle: the flop (3), turn (1), river (1).",
      "You make the best 5-card hand using any combination of your 2 cards and the 5 board cards.",
      "Betting rounds: pre-flop, flop, turn, river. On any round you can fold, check, call, bet, or raise.",
      "\"No-Limit\" means you can shove all your chips in at any time.",
    ],
    tip: "Premium starting hands (AA, KK, QQ, AK) win more than anything else. When in doubt, fold trash and play tight early.",
  },
  {
    icon: Diamond,
    name: "Pot-Limit Omaha (PLO)",
    when: "Big-action game, popular with experienced players.",
    basics: [
      "You get 4 private hole cards instead of 2.",
      "Same 5-card board as Hold'em.",
      "You MUST use exactly 2 of your hole cards plus exactly 3 board cards — no more, no less.",
      "\"Pot-Limit\" means the largest bet you can make is the current pot size.",
      "Equity runs much closer between hands than Hold'em — premium hands win less often.",
    ],
    tip: "Look for hands where all 4 cards work together (suited, connected, paired). Dangling junk cards turn good starts into trap hands.",
  },
  {
    icon: Heart,
    name: "5-Card PLO",
    when: "PLO on steroids — even more action.",
    basics: [
      "Same rules as PLO but you get 5 hole cards.",
      "Still must use exactly 2 hole + 3 board cards to make your hand.",
      "Even more possible combinations means even closer equities.",
      "Variance is wild — small edges compound into big swings.",
    ],
    tip: "Hand selection matters more, not less. A premium 4-card start with a useless 5th card is worse than a clean coordinated 5.",
  },
  {
    icon: Club,
    name: "Seven-Card Stud",
    when: "Classic game, no community cards.",
    basics: [
      "No flop, no shared board.",
      "You're dealt 7 cards total across multiple streets: 2 down + 1 up, then three more up cards, then a final down card.",
      "You make the best 5-card hand from your own 7 cards.",
      "Betting rounds happen after each new card.",
      "The lowest visible up-card brings the action on third street; high hand acts first afterwards.",
    ],
    tip: "Pay attention to opponents' up-cards — your outs literally disappear when you can see them in someone else's hand.",
  },
];

function HowToPlay() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">For new initiates</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">
            New to <span className="text-wizard">poker</span>? Start here.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The fastest plain-English primer for each game Poker Paladin supports. Read the card for your game, then let the paladin do the math.
          </p>
        </header>

        <section className="grid gap-5 pb-12 md:grid-cols-2">
          {GAMES.map((g) => (
            <div key={g.name} className="arcane-border p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl arcane-gradient text-primary-foreground">
                  <g.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-xl font-bold">{g.name}</div>
                  <div className="font-data text-xs text-wizard">{g.when}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {g.basics.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold">▸</span> <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs">
                <span className="font-semibold text-gold">Paladin tip · </span>
                <span className="text-muted-foreground">{g.tip}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="arcane-border my-8 p-6 text-center md:p-10">
          <Sparkles className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 font-display text-2xl font-black">Ready to deal in?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Read the <Link to="/user-guide" className="text-gold underline">user manual</Link> for the 2-minute setup, then summon the paladin and play your first hand with math at your back.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/user-guide"><Button size="lg" variant="secondary">Read the user manual</Button></Link>
            <Link to="/demo"><Button size="lg" className="font-bold">Try the demo →</Button></Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
