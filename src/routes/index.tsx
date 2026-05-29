import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScanEye, Radio, BarChart3, Mic, Smartphone, Puzzle, Check, ShieldAlert, Sparkles } from "lucide-react";
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
              A novelty training tool for serious players. Share your screen, the paladin reads the table every five seconds, runs the math, and whispers the play — call, fold, raise, or shove.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/pricing"><Button size="lg" className="font-bold">View pricing →</Button></Link>
              <Link to="/demo"><Button size="lg" variant="secondary">Try the demo</Button></Link>
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
            { icon: Radio, t: "Go Live (Pro)", d: "Auto-refresh every 5s. The verdict is on screen the moment it's your turn to act." },
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
            <AddOn icon={Puzzle} name="Chrome Extension" price="$10/mo" desc="Capture from a single tab — no full screen share." />
            <AddOn icon={Smartphone} name="Mobile Renderer" price="$8/mo" desc="Mirror the verdict to your phone via a pair code." />
          </div>
          <div className="mt-6 text-center">
            <Link to="/pricing"><Button variant="outline" size="lg">Full pricing & add-ons →</Button></Link>
          </div>
        </section>

        {/* TRUST */}
        <section className="arcane-border my-10 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h3 className="font-display text-xl font-bold">What this is — and isn't.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Poker Paladin is a novelty training & analysis companion. It watches the screen <em>you</em> are already looking at, the same way a coach over your shoulder would. It does not bot, scrape, inject, or communicate with any poker site. It cannot act for you. You are always the one clicking the button.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
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
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-5">
      <nav className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl arcane-gradient text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-black tracking-wider">POKER<span className="text-gold"> PALADIN</span></span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
          <Link to="/demo"><Button variant="ghost" size="sm">Demo</Button></Link>
          <Link to="/faq"><Button variant="ghost" size="sm">FAQ</Button></Link>
        </div>
        <div className="flex items-center gap-2">
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
        <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        <Link to="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
        <Link to="/refund-policy" className="hover:text-foreground">Refunds</Link>
        <Link to="/demo" className="hover:text-foreground">Demo</Link>
      </div>
      <p className="mt-3">© Poker Paladin · A novelty training & analysis tool. You are responsible for compliance with every site's Terms of Service.</p>
    </footer>
  );
}
