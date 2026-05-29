import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "./index";
import { ShieldAlert, X, Check } from "lucide-react";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Poker Paladin" },
      { name: "description", content: "Poker Paladin is a novelty training and analysis tool. Read what it does, what it does not do, and what we will never condone." },
      { property: "og:title", content: "Poker Paladin Disclaimer" },
      { property: "og:description", content: "Read before you buy." },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Disclaimer</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">Read this. <span className="text-wizard">Before you buy.</span></h1>
        </header>

        <section className="arcane-border glow-gold p-6 md:p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="font-display text-xl font-bold">Poker Paladin is a novelty training & analysis tool.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Paladin exists so curious players, students of the game, and serious hobbyists can <em>see the math</em> in real time the way world-class players already do in their heads. It is sold for training, study, hand review, and entertainment.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="arcane-border p-5">
            <div className="flex items-center gap-2 font-display font-bold"><Check className="h-5 w-5 text-wizard" /> What Paladin does</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Reads pixels from a screen <em>you</em> are already sharing.</li>
              <li>• Calculates equity, pot odds, and recommended sizing.</li>
              <li>• Suggests an action: fold, check, call, raise, or shove.</li>
              <li>• Logs hands so you can review your decisions later.</li>
            </ul>
          </div>
          <div className="arcane-border p-5">
            <div className="flex items-center gap-2 font-display font-bold"><X className="h-5 w-5 text-destructive" /> What Paladin does NOT do</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Inject code, scripts, or memory hooks into any poker site or client.</li>
              <li>• Scrape, intercept, or modify any poker site's network traffic.</li>
              <li>• Auto-click, auto-bet, or auto-anything. You always click yourself.</li>
              <li>• Communicate with other Paladin users at your table — there is no collusion network.</li>
              <li>• Read or store opponents' hole cards. It only knows what your screen shows.</li>
            </ul>
          </div>
        </section>

        <section className="arcane-border my-8 p-6 md:p-8">
          <h2 className="font-display text-lg font-bold">Site Terms of Service</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Most online poker sites' Terms of Service prohibit real-time decision-assistance software during real-money play, regardless of how the assistance is delivered. You are solely responsible for reading and complying with the ToS of any site you use. We do not encourage, condone, or support using Paladin in violation of any site's rules. We recommend it for:
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li className="rounded-md bg-card/40 px-3 py-2">• Home games with friends</li>
            <li className="rounded-md bg-card/40 px-3 py-2">• Play-money / social poker</li>
            <li className="rounded-md bg-card/40 px-3 py-2">• Hand-history review &amp; coaching</li>
            <li className="rounded-md bg-card/40 px-3 py-2">• Watching streams and studying</li>
            <li className="rounded-md bg-card/40 px-3 py-2">• Training apps / equity practice</li>
            <li className="rounded-md bg-card/40 px-3 py-2">• Live cash games (mental math practice)</li>
          </ul>
        </section>

        <section className="arcane-border p-6 md:p-8">
          <h2 className="font-display text-lg font-bold">Liability &amp; gambling</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Paladin is provided "as is" with no warranty of accuracy, profit, or fitness for any particular use. Poker involves risk and chance. The recommendations are statistical suggestions, not guarantees. You can and will lose money playing poker. Never wager more than you can afford to lose. If gambling is a problem for you, visit <a href="https://www.ncpgambling.org/help-treatment/" target="_blank" rel="noopener noreferrer" className="text-gold underline">ncpgambling.org</a> for free, confidential help.
          </p>
        </section>

        <div className="my-10 text-center text-sm text-muted-foreground">
          By creating an account or purchasing, you confirm you have read, understood, and accept this disclaimer.
          <div className="mt-4">
            <Link to="/pricing" className="text-gold underline">Return to pricing</Link>
          </div>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
