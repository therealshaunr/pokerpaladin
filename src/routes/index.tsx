import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Spade, ScanEye, Radio, BarChart3, Mic, Smartphone, Puzzle, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poker Paladin — Real-time poker strategy co-pilot" },
      { name: "description", content: "Share your screen, get instant pot-odds, equity and action recommendations. Built for serious players. Standard $49.99/mo, Pro $79.99/mo." },
      { property: "og:title", content: "Poker Paladin" },
      { property: "og:description", content: "Real-time poker strategy co-pilot." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="matrix-bg min-h-dvh">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Spade className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-black">POKER<span className="text-matrix"> PALADIN</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login" search={{ redirect: "/portal" }}><Button size="sm">Get started</Button></Link>
          </div>
        </nav>

        <section className="py-16 text-center md:py-24">
          <p className="font-data text-xs uppercase tracking-[0.3em] text-matrix">Real-time table reader</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight md:text-6xl">
            Win more hands with a<br /><span className="text-matrix">mathematically honest</span> co-pilot.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Share your poker screen. Paladin reads the table every five seconds, runs the math, and tells you exactly what to do — call, fold, raise, or shove.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/login" search={{ redirect: "/portal" }}>
              <Button size="lg" className="font-bold">Start your trial →</Button>
            </Link>
            <a href="#pricing"><Button size="lg" variant="secondary">See pricing</Button></a>
          </div>
        </section>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {[
            { icon: ScanEye, t: "Live table reader", d: "Connect your screen — we extract cards, stacks, pot and seats automatically." },
            { icon: BarChart3, t: "Pot odds & equity", d: "Monte-Carlo equity, premium pre-flop, and pot-fraction sizing on every decision." },
            { icon: Radio, t: "Go Live (Pro)", d: "Auto-refresh every 5s with the verdict front and center the moment it's your turn." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="h-6 w-6 text-matrix" />
              <div className="mt-3 font-display text-lg font-bold">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>

        <section id="pricing" className="py-12">
          <h2 className="text-center font-display text-3xl font-black">Pick your tier</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Monthly · 10% off quarterly · 10% off yearly</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <PriceCard
              name="Standard"
              price="$49.99"
              features={[
                "Live table reader & analyzer",
                "Manual analyze (5–7s)",
                "Hand strength suggestions",
                "Player habit analysis",
                "Blinds, levels, timer",
              ]}
            />
            <PriceCard
              name="Pro"
              price="$79.99"
              highlight
              features={[
                "Everything in Standard",
                "Go Live auto-refresh",
                "Voice guidance (call / fold / raise)",
                "Session recording & hand export",
                "Priority strategy model",
              ]}
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <AddOn icon={Puzzle} name="Extension / Connector" price="$10/mo" desc="Browser extension and local connector for bridging devices." />
            <AddOn icon={Smartphone} name="Mobile Rendering" price="Coming soon" desc="Mirror Paladin to your phone over a secure pair code." />
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          © Poker Paladin · A training & analysis tool. Always confirm decisions yourself.
        </footer>
      </div>
    </main>
  );
}

function PriceCard({ name, price, features, highlight }: { name: string; price: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-6 ${highlight ? "border-primary glow-matrix" : "border-border"}`}>
      <div className="flex items-baseline justify-between">
        <div className="font-display text-2xl font-black">{name}</div>
        <div className="font-display text-2xl font-black text-matrix">{price}<span className="text-sm text-muted-foreground">/mo</span></div>
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-matrix" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/login" search={{ redirect: "/portal" }} className="mt-5 block">
        <Button className="w-full font-bold">Choose {name}</Button>
      </Link>
    </div>
  );
}

function AddOn({ icon: Icon, name, price, desc }: { icon: typeof Puzzle; name: string; price: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-matrix" />
          <div className="font-display text-lg font-bold">{name}</div>
        </div>
        <div className="font-data text-sm">{price}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
