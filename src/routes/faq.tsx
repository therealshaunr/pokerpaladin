import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "./index";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Poker Paladin" },
      { name: "description", content: "What Poker Paladin is, what it isn't, how it works, and how billing, licensing, and refunds operate." },
      { property: "og:title", content: "Poker Paladin FAQ" },
      { property: "og:description", content: "Honest answers about a novelty poker training tool." },
    ],
  }),
  component: FAQ,
});

const QA = [
  {
    q: "Is this a poker bot?",
    a: "No. Poker Paladin does not act for you. It does not click, type, or move your mouse. It looks at the screen you are sharing the same way a coach would and tells you what the math suggests. You always make the final decision and the final click.",
  },
  {
    q: "Does it scrape poker sites or read their code?",
    a: "No. Paladin uses your operating system's standard screen-share API (the same one used by Zoom, Discord and Google Meet). It reads pixels you are already looking at. It never touches a poker site's network requests, files, memory, or backend.",
  },
  {
    q: "Is it legal?",
    a: "We sell Paladin as a novelty training and analysis tool. Most poker sites' Terms of Service prohibit any real-time decision assistance during real-money play. Using it on a site that forbids it is between you and that site. We strongly recommend it for home games, play-money tables, hand-history review, training apps, and live-stream study.",
  },
  {
    q: "How does the math work?",
    a: "Monte-Carlo equity simulation against likely opponent ranges, premium pre-flop hand floors based on position, pot-odds and pot-fraction sizing, and post-flop heuristics drawn from standard poker theory (The Wizard of Odds, Caro's Book of Tells, modern GTO solvers). It is not psychic — it is a faster calculator than you can be in 30 seconds.",
  },
  {
    q: "How do I get my license key?",
    a: "After a successful payment via Stripe, PayPal, or (soon) crypto, our system generates a 25-character license key tied to your account and emails it to you instantly. You then paste it on the Activate page in your portal to unlock your plan and add-ons.",
  },
  {
    q: "What if I lose the key?",
    a: "Open a support ticket from your portal. An admin can resend it or generate a new one. Keys are tied to your account — they cannot be transferred.",
  },
  {
    q: "What are 'Go Live' hours?",
    a: "Go Live is Pro's auto-refresh mode where Paladin re-reads the table every 5 seconds. Pro includes 60 hours per month (enough for ~14 hours/week of active play). If you exceed that, you can buy a 10-Hour Pack for $14.99 that stacks with your plan and lasts 90 days.",
  },
  {
    q: "Do I get a free trial?",
    a: (<>No license-gated trial — instead our <Link to="/demo" className="text-gold underline">public demo</Link> lets anyone try the analyzer on a frozen sample hand without signing up. Combined with our 7-day money-back guarantee, you can try Paladin risk-free.</>),
  },
  {
    q: "How do refunds work?",
    a: (<>If you signed the disclaimer at signup and are within 7 days of purchase, we'll refund your subscription and disable the account. Full details on the <Link to="/refund-policy" className="text-gold underline">refund policy page</Link>.</>),
  },
  {
    q: "How do I get support?",
    a: "All support runs through your portal — no email back-and-forth. Open a ticket from /portal/support and an admin will respond in-app. You'll see replies in real time without checking your inbox.",
  },
  {
    q: "Can I use Paladin on multiple computers?",
    a: "Yes — your license is tied to your account, not a machine. Sign in on any device. Only one active session at a time per account.",
  },
  {
    q: "What's the crypto payment story?",
    a: "BTC, ETH, XRP and the other top coins via our Changelly affiliate. Coming soon — for now use Stripe or PayPal at checkout.",
  },
] as const;

function FAQ() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">FAQ</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">Honest <span className="text-wizard">answers</span>.</h1>
        </header>

        <Accordion type="single" collapsible className="arcane-border p-2 md:p-4">
          {QA.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-display text-base font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="my-10 text-center text-sm text-muted-foreground">
          Still have questions? <Link to="/login" search={{ redirect: "/portal" }} className="text-gold underline">Sign in</Link> and open a support ticket.
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
