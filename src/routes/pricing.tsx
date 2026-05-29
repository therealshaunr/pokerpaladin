import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Mic, Puzzle, Smartphone, Clock, Bitcoin } from "lucide-react";
import { SiteNav, SiteFooter } from "./index";
import { useAuth } from "@/lib/auth";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  validateSearch: (s: Record<string, unknown>) => ({
    buy: typeof s.buy === "string" ? s.buy : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pricing — Poker Paladin" },
      { name: "description", content: "Standard $79.99/mo, Pro $149.99/mo with 60 Go-Live hours, plus add-ons and 10-hour Go-Live packs. Pay via card, PayPal, or crypto (soon)." },
      { property: "og:title", content: "Poker Paladin Pricing" },
      { property: "og:description", content: "Two tiers, transparent add-ons, no surprises." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { buy: buyParam } = Route.useSearch();
  const [activePrice, setActivePrice] = useState<string | null>(null);

  useEffect(() => {
    if (user && buyParam) {
      setActivePrice(buyParam);
      navigate({ to: "/pricing", search: {}, replace: true });
    }
  }, [user, buyParam, navigate]);

  const buy = (priceId: string) => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/pricing?buy=${priceId}` } });
      return;
    }
    setActivePrice(priceId);
  };

  return (
    <main className="matrix-bg min-h-dvh">
      <PaymentTestModeBanner />
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">Pick your <span className="text-wizard">order</span>.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Monthly billing. Cancel anytime in your portal. 7-day money-back guarantee — see <Link to="/refund-policy" className="text-gold underline">refund policy</Link>.</p>
        </header>

        {/* TIERS */}
        <section className="grid gap-5 md:grid-cols-2">
          <Tier
            name="Standard"
            priceId="std_monthly"
            price="$79.99"
            tagline="For the casual / weekend player"
            features={[
              "Live table reader & analyzer",
              "250 manual analyses per day",
              "Hand strength & pot odds",
              "Player habit tracking",
              "Blinds, levels, timer",
              "Email + in-portal support tickets",
            ]}
            notIncluded={["Go Live auto-refresh", "Voice companion", "Session export"]}
            onBuy={buy}
          />
          <Tier
            name="Pro"
            priceId="pro_monthly"
            price="$149.99"
            tagline="For the serious grinder · 60 Go-Live hours / month"
            highlight
            features={[
              "Everything in Standard",
              "Unlimited manual analyses",
              "60 Go-Live hours per month",
              "Voice companion included",
              "Session recording & hand export",
              "Priority strategy model",
              "First-in-line support",
            ]}
            notIncluded={[]}
            onBuy={buy}
          />
        </section>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Run out of Go-Live hours? Buy a <span className="text-gold">10-Hour Pack</span> for $14.99 — valid 90 days, stacks with your plan.
        </p>

        {/* ADD-ONS */}
        <section className="py-12">
          <h2 className="font-display text-2xl font-black">Add-ons</h2>
          <p className="mt-1 text-sm text-muted-foreground">Toggle these on or off any time from your portal.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <AddOnCard icon={Mic} name="Voice Companion" price="$10 / mo" priceId="voice_monthly" desc="Whispered call/fold/raise on every street. Pro only — included in Pro by default." onBuy={buy} />
            <AddOnCard icon={Puzzle} name="Focus Lens" price="$10 / mo" priceId="lens_monthly" desc="Capture a single window you choose — not your whole screen. Read-only pixel capture; never touches the betting site." onBuy={buy} />
            <AddOnCard icon={Smartphone} name="Mobile Renderer" price="$8 / mo" priceId="mobile_monthly" desc="Mirror the verdict to your phone via a secure pair code." onBuy={buy} />
            <AddOnCard icon={Clock} name="10-Hour Pack" price="$14.99 once" priceId="topup_10h_once" desc="+10 Go-Live hours, valid 90 days. Stacks with Pro." onBuy={buy} />
          </div>
        </section>

        {/* PAYMENT METHODS */}
        <section className="arcane-border my-8 p-6">
          <h2 className="font-display text-xl font-black">Pay your way</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Method title="Credit / Debit" body="Stripe-secured checkout. Apple Pay & Google Pay supported." status="ready" />
            <Method title="PayPal" body="One-tap PayPal Checkout, including subscriptions." status="ready" />
            <Method title="Crypto" body="BTC, ETH, XRP and more via Changelly affiliate." status="soon" icon={Bitcoin} />
          </div>
        </section>

        {/* FLOW */}
        <section className="my-10 grid gap-4 md:grid-cols-4">
          {[
            { n: "1", t: "Choose plan", d: "Pick Standard or Pro and any add-ons at checkout." },
            { n: "2", t: "Pay", d: "Card, PayPal, or crypto (soon)." },
            { n: "3", t: "Get your key", d: "A 25-character license key is emailed instantly." },
            { n: "4", t: "Activate", d: "Paste it in your portal — paladin unlocks for the account." },
          ].map((s) => (
            <div key={s.n} className="arcane-border p-5">
              <div className="font-display text-3xl font-black text-gold">{s.n}</div>
              <div className="mt-1 font-display font-bold">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </section>

        <div className="my-12 text-center">
          {user ? (
            <Link to="/portal"><Button size="lg" className="font-bold">Open your portal →</Button></Link>
          ) : (
            <Link to="/login" search={{ redirect: "/portal" }}><Button size="lg" className="font-bold">Create your account →</Button></Link>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Or <Link to="/demo" className="text-gold underline">try the demo first</Link> — no signup required.</p>
        </div>

        <SiteFooter />
      </div>

      <Dialog open={!!activePrice} onOpenChange={(o) => !o && setActivePrice(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display">Summon the Paladin</DialogTitle>
          </DialogHeader>
          {activePrice && user && (
            <div className="px-2 pb-2">
              <StripeEmbeddedCheckout
                priceId={activePrice}
                userId={user.id}
                customerEmail={user.email ?? undefined}
                returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Tier({ name, priceId, price, tagline, features, notIncluded, highlight, onBuy }: { name: string; priceId: string; price: string; tagline: string; features: string[]; notIncluded: string[]; highlight?: boolean; onBuy: (id: string) => void }) {
  return (
    <div className={`arcane-border p-7 ${highlight ? "glow-wizard" : ""}`}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display text-3xl font-black">{name}</div>
          <p className="mt-1 text-sm text-wizard">{tagline}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl font-black text-gold">{price}</div>
          <div className="text-xs text-muted-foreground">/ month</div>
        </div>
      </div>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> <span>{f}</span>
          </li>
        ))}
        {notIncluded.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
            <span className="mt-0.5 inline-block h-4 w-4 shrink-0">—</span> <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button onClick={() => onBuy(priceId)} className="mt-6 w-full font-bold" size="lg">Summon the Paladin →</Button>
    </div>
  );
}

function AddOnCard({ icon: Icon, name, price, priceId, desc, onBuy }: { icon: typeof Mic; name: string; price: string; priceId: string; desc: string; onBuy: (id: string) => void }) {
  return (
    <div className="arcane-border p-5 flex flex-col">
      <Icon className="h-5 w-5 text-gold" />
      <div className="mt-2 font-display font-bold">{name}</div>
      <div className="font-data text-xs text-wizard">{price}</div>
      <p className="mt-2 text-xs text-muted-foreground flex-1">{desc}</p>
      <Button onClick={() => onBuy(priceId)} variant="outline" size="sm" className="mt-3 w-full">Add</Button>
    </div>
  );
}

function Method({ title, body, status, icon: Icon }: { title: string; body: string; status: "ready" | "soon"; icon?: typeof Bitcoin }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <div className="font-display font-bold flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-gold" /> : null}
          {title}
        </div>
        {status === "soon" ? (
          <span className="rounded-full bg-gold/15 px-2 py-0.5 font-data text-[10px] uppercase tracking-wider text-gold">Soon</span>
        ) : (
          <span className="rounded-full bg-wizard/20 px-2 py-0.5 font-data text-[10px] uppercase tracking-wider text-wizard">Ready</span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
