import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScanEye, Radio, BarChart3, Mic, Smartphone, Puzzle, Check, ShieldAlert, Sparkles, Apple, ShoppingBag } from "lucide-react";
import { PocketQR } from "@/components/PocketQRCard";
import { useCart } from "@/lib/cart";
import heroImg from "@/assets/paladin-hero.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poker Paladin — Arcane poker strategy co-pilot" },
      { name: "description", content: "A dark-fantasy training tool that reads the table, runs the math, and whispers the right play. Standard $79.99/mo · Pro $149.99/mo." },
      { property: "og:title", content: "Poker Paladin — Arcane poker strategy co-pilot" },
      { property: "og:description", content: "Read the table. Run the math. Make the play." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div className="order-2 md:order-1">
            <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Wizardry · Math · Poker</p>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] md:text-6xl">
              Summon the <span className="text-wizard">paladin</span><br />
              of <span className="text-gold">cold, hard odds.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Poker Paladin tracks every card, bet, and tell on your screen in as close to real time as possible. Standard players read the table. <span className="font-semibold text-wizard">The Arcanum</span> reads the players reading the table. Want millisecond reactions and live in-hand calls? You'll need to go <span className="font-semibold text-gold">Pro</span>.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/pricing"><Button size="lg" className="font-bold">View pricing →</Button></Link>
              <Link to="/demo"><Button size="lg" variant="secondary">Try the demo</Button></Link>
              <Link to="/how-to-play"><Button size="lg" variant="ghost">New to poker?</Button></Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-gold" />
              Training & analysis only. We never read game code, scrape sites, or inject software.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <div className="arcane-border glow-wizard mx-auto max-w-md overflow-hidden">
              <img
                src={heroImg}
                alt="Hooded paladin holding a staff wrapped in shredded playing cards, surrounded by arcane purple smoke and floating gold sigils"
                width={1024}
                height={1024}
                className="block h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="grid gap-4 py-10 md:grid-cols-3">
          {[
            { icon: ScanEye, t: "Reads the table", d: "Hole cards, board, pot and stacks — extracted from your shared screen automatically." },
            { icon: BarChart3, t: "Honest math", d: "Monte-Carlo equity, premium pre-flop floors, pot-fraction sizing on every decision." },
            { icon: Radio, t: "Go Live (Pro)", d: "The first sub-second poker co-pilot. Re-reads the table every heartbeat and surfaces the play before your timer ticks. This is what separates a standard player from The Arcanum." },
          ].map((f) => (
            <div key={f.t} className="arcane-border p-5">
              <f.icon className="h-6 w-6 text-gold" />
              <div className="mt-3 font-display text-lg font-bold">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>

        {/* PRICING TEASER */}
        <section className="py-14">
          <div className="text-center">
            <p className="font-data text-xs uppercase tracking-[0.3em] text-gold">Choose your order</p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">Two tiers. No surprises.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <TierTeaser
              name="Standard"
              price="$79.99"
              tagline="Manual analysis · 250 scans / day"
              features={["Live table reader", "Manual analyze (5–7s)", "Hand strength & odds", "Player habit tracking", "Blinds, levels, timer"]}
            />
            <TierTeaser
              name="Pro"
              price="$149.99"
              highlight
              tagline="Auto Go-Live · 60 hrs / month included"
              features={["Everything in Standard", "Go Live auto-refresh", "Voice companion", "Session recording & export", "Priority strategy model"]}
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <AddOn icon={Mic} name="Voice Companion" price="$10/mo" desc="Whispered verdict on every street. Pro only." />
            <AddOn icon={Puzzle} name="Focus Lens" price="$10/mo" desc="Capture a single window you choose — not your whole screen. Read-only pixel capture; never touches the site." />
            <AddOn icon={Smartphone} name="Mobile Renderer" price="$8/mo" desc="Mirror the verdict to your phone via a pair code." />
          </div>
          <div className="mt-6 text-center">
            <Link to="/pricing"><Button variant="outline" size="lg">Full pricing & add-ons →</Button></Link>
          </div>
        </section>

        {/* PALADIN POCKET — Mobile companion */}
        <section className="arcane-border my-10 overflow-hidden p-6 md:p-8 glow-wizard">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-data text-xs uppercase tracking-[0.3em] text-gold">New · live</p>
              <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
                Get <span className="text-wizard">Paladin Pocket</span> on your phone.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                A glance-only mirror of every verdict the Paladin produces — equity, pot odds, EV, decision, suggested size — pushed to your phone in real time. Install in 10 seconds, no app store required.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/pocket/install"><Button size="lg" className="gap-2"><Smartphone className="h-4 w-4" /> Install on Android</Button></Link>
                <Link to="/pocket/install"><Button size="lg" variant="secondary" className="gap-2"><Apple className="h-4 w-4" /> Install on iPhone</Button></Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Both buttons go to the same install guide — Pocket is a single PWA that works on both platforms.</p>
            </div>
            <div className="flex flex-col items-center">
              <PocketQR url={typeof window !== "undefined" ? `${window.location.origin}/pocket/install` : ""} size={180} />
              <p className="mt-2 font-data text-[10px] uppercase tracking-[0.3em] text-gold">Scan with your phone</p>
            </div>
          </div>
        </section>

        {/* PALADIN ARMORY — Merch shop showcase */}
        <section className="my-10 rounded-2xl border border-gold/50 bg-gradient-to-br from-gold/10 via-card to-transparent p-6 md:p-8 shadow-[0_0_60px_-20px_rgba(212,175,76,0.6)]">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="text-center md:text-left">
              <p className="font-data text-xs uppercase tracking-[0.3em] text-gold">The Paladin Armory</p>
              <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
                Wear the <span className="text-gold">order.</span> Carry the <span className="text-wizard">creed.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Tees, hoodies, shades, socks, water bottles, stickers — branded gear for the Paladin faithful. Bundle 3+ for 10% off · free shipping over $100.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link to="/shop"><Button size="lg" className="gap-2 font-bold"><ShoppingBag className="h-4 w-4" /> Visit the Armory</Button></Link>
              </div>
            </div>
            <div className="hidden md:flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-gold/40 bg-gold/10">
              <ShoppingBag className="h-16 w-16 text-gold" />
            </div>
          </div>
        </section>




        <section className="arcane-border my-10 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h3 className="font-display text-xl font-bold">What this is — and isn't.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Poker Paladin is a novelty training & analysis companion. It watches the screen <em>you</em> are already looking at, the same way a coach over your shoulder would. It does not bot, scrape, inject, or communicate with any poker site. It cannot act for you. You are always the one clicking the button.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-gold">Focus Lens</span> is a window-scoped screen capture — not a browser extension. Nothing is ever installed into the poker site's page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/user-guide"><Button variant="ghost" size="sm">User manual</Button></Link>
                <Link to="/how-to-play"><Button variant="ghost" size="sm">How to play</Button></Link>
                <Link to="/faq"><Button variant="ghost" size="sm">FAQ</Button></Link>
                <Link to="/disclaimer"><Button variant="ghost" size="sm">Disclaimer</Button></Link>
                <Link to="/refund-policy"><Button variant="ghost" size="sm">Refund policy</Button></Link>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}

function TierTeaser({ name, price, tagline, features, highlight }: { name: string; price: string; tagline: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`arcane-border p-6 ${highlight ? "glow-wizard" : ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="font-display text-2xl font-black">{name}</div>
        <div className="font-display text-3xl font-black text-gold">{price}<span className="text-sm text-muted-foreground">/mo</span></div>
      </div>
      <p className="mt-1 text-sm text-wizard">{tagline}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-gold" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/pricing" className="mt-5 block">
        <Button className="w-full font-bold">Choose {name}</Button>
      </Link>
    </div>
  );
}

function AddOn({ icon: Icon, name, price, desc }: { icon: typeof Puzzle; name: string; price: string; desc: string }) {
  return (
    <div className="arcane-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gold" />
          <div className="font-display text-lg font-bold">{name}</div>
        </div>
        <div className="font-data text-sm text-wizard">{price}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export function SiteNav() {
  const { totals } = useCart();
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-5">
      <nav className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl arcane-gradient text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-black tracking-wider">POKER<span className="text-gold"> PALADIN</span></span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
          <Link to="/demo"><Button variant="ghost" size="sm">Demo</Button></Link>
          <Link to="/shop"><Button variant="ghost" size="sm">Shop</Button></Link>
          <Link to="/how-to-play"><Button variant="ghost" size="sm">How to play</Button></Link>
          <Link to="/user-guide"><Button variant="ghost" size="sm">Manual</Button></Link>
          <Link to="/faq"><Button variant="ghost" size="sm">FAQ</Button></Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/shop/cart"
            aria-label={`Cart (${totals.itemCount} items)`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card hover:border-gold/40"
          >
            <ShoppingBag className="h-4 w-4" />
            {totals.itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-data text-[10px] font-black text-background">
                {totals.itemCount}
              </span>
            )}
          </Link>
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/login" search={{ redirect: "/portal" }}><Button size="sm">Get started</Button></Link>
        </div>
      </nav>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <Link to="/how-to-play" className="hover:text-foreground">How to play</Link>
        <Link to="/user-guide" className="hover:text-foreground">User manual</Link>
        <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        <Link to="/about" className="hover:text-foreground">About · Veteran</Link>
        <Link to="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
        <Link to="/refund-policy" className="hover:text-foreground">Refunds</Link>
        <Link to="/demo" className="hover:text-foreground">Demo</Link>
      </div>
      <p className="mt-3">© Poker Paladin · A novelty training & analysis tool. You are responsible for compliance with every site's Terms of Service.</p>
    </footer>
  );
}
