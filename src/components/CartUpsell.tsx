import { Link } from "@tanstack/react-router";
import { Mic, Puzzle, Smartphone, Sparkles, ArrowRight } from "lucide-react";

const UPSELLS = [
  {
    icon: Sparkles,
    name: "Paladin Pro",
    price: "$149.99/mo",
    desc: "60 Go-Live hours, voice companion, priority strategy model.",
    to: "/pricing?buy=pro_monthly",
  },
  {
    icon: Mic,
    name: "Voice Companion",
    price: "$10/mo",
    desc: "Whispered call / fold / raise on every street.",
    to: "/pricing?buy=voice_monthly",
  },
  {
    icon: Puzzle,
    name: "Focus Lens",
    price: "$10/mo",
    desc: "Window-scoped capture — no whole-screen sharing.",
    to: "/pricing?buy=lens_monthly",
  },
  {
    icon: Smartphone,
    name: "Mobile Renderer",
    price: "$8/mo",
    desc: "Mirror verdicts to your phone with a pair code.",
    to: "/pricing?buy=mobile_monthly",
  },
] as const;

/**
 * Cart cross-sell — surfaces plans and add-ons without forcing the user
 * to leave the cart. Each link opens the pricing page with the embedded
 * Stripe checkout pre-selected. Apparel checkout runs as a separate
 * Stripe session — merch and subscriptions cannot share a session.
 */
export function CartUpsell() {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-black uppercase tracking-wide">
          Complete your kit
        </h3>
        <span className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Plans & add-ons
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Subscriptions are billed separately from merch.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {UPSELLS.map(({ icon: Icon, name, price, desc, to }) => (
          <Link
            key={name}
            to={to as string}
            className="group flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3 transition hover:border-gold/50 hover:bg-gold/5"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold">{name}</span>
                <span className="font-data text-[10px] text-wizard">{price}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{desc}</p>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-gold" />
          </Link>
        ))}
      </div>
    </div>
  );
}
