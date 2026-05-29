import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteNav, SiteFooter } from "./index";
import { Clock, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/user-guide")({
  head: () => ({
    meta: [
      { title: "User Guide — Poker Paladin" },
      { name: "description", content: "Two-minute setup, the live hand flow, and troubleshooting for Poker Paladin's screen-reading co-pilot." },
      { property: "og:title", content: "Poker Paladin User Guide" },
      { property: "og:description", content: "Setup, live flow, troubleshooting." },
    ],
  }),
  component: UserGuide,
});

function UserGuide() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">User guide</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">
            From <span className="text-wizard">zero</span> to <span className="text-gold">summoned</span> in 2 minutes.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Run through this once before your first session. After that, it's muscle memory — under a minute to fire the paladin up at a new table.
          </p>
        </header>

        {/* SETUP */}
        <Section icon={Clock} title="A · Before the hand starts (2–3 minutes)">
          <p className="text-sm text-muted-foreground">
            Do this <span className="text-gold font-semibold">before</span> the first hand is dealt. Once the action's live you want zero friction.
          </p>
          <Steps
            items={[
              "Open your poker client (or table) and join the game like normal.",
              "In Poker Paladin → pick the variant (Hold'em, Omaha, PLO5, Stud).",
              "Enter your small blind / big blind / ante. For cash games these stay constant; for tournaments the level timer will track changes.",
              "Set seat count and your seat position so the paladin knows where you sit.",
              "Hit Summon the Paladin →.",
              "Click Share screen (or Focus Lens if you have the add-on) and select your poker window.",
              "Verify the live table appears in the preview pane. If the cards are unreadable, drag the capture region tighter.",
            ]}
          />
        </Section>

        {/* DURING */}
        <Section icon={Eye} title="B · During the hand">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <div className="font-display font-bold">Standard tier</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Drop your hole cards in once dealt. When it's your turn, hit <span className="text-gold font-semibold">Best play</span> and the paladin returns a verdict in 5–7 seconds.
              </p>
            </div>
            <div className="rounded-lg border border-wizard/40 bg-wizard/5 p-4">
              <div className="font-display font-bold text-wizard">Pro tier · Go Live</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Leave Go Live on. The paladin re-reads the table every heartbeat and locks the verdict the instant the action gets to you. Don't switch tabs — the capture pauses.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The <span className="text-gold font-semibold">What to do</span> panel shows one of: FOLD · CHECK · CALL · BET (size) · RAISE (size) · ALL IN. The verdict only ever displays when it's actually your turn — between actions it shows "Waiting for your turn" so you're never reading a stale call.
          </p>
        </Section>

        {/* TROUBLESHOOTING */}
        <Section icon={AlertTriangle} title="C · Troubleshooting">
          <Trouble
            symptom="Verdict feels stale or out of date."
            fix={'Confirm the timer chip says "Reading…". If it\'s stuck, stop sharing and re-share the correct window.'}
          />
          <Trouble
            symptom="Cards aren't being detected."
            fix="Drag the capture region tighter around the cards. Increase your client's card size in display settings. Make sure your poker window isn't behind another window."
          />
          <Trouble
            symptom={'The paladin flipped from "Raise" to "Fold" while I was waiting.'}
            fix={'Fixed in this release — the panel now freezes the last verdict and shows a "Waiting for your turn" badge between actions. If you still see flipping, open a support ticket from your portal with a screenshot.'}
          />
          <Trouble
            symptom="No voice in Go Live (Pro)."
            fix="Enable mic permission for the browser tab and confirm Voice Companion is toggled ON in your portal."
          />
          <Trouble
            symptom="Wrong blinds detected."
            fix="Open the blinds panel and set them manually — vision auto-sync will resume on the next clean read."
          />
          <Trouble
            symptom="Go-Live hours running low."
            fix="Buy a 10-Hour Pack from your portal for $14.99. It stacks with your monthly allowance and stays valid for 90 days."
          />
        </Section>

        {/* WHAT IT IS NOT */}
        <Section icon={CheckCircle2} title="What the paladin will never do">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-gold">▸</span> Read or scrape the poker site's code or DOM.</li>
            <li className="flex gap-2"><span className="text-gold">▸</span> Inject anything into your poker client.</li>
            <li className="flex gap-2"><span className="text-gold">▸</span> Click, type, or take any action for you. You're always the one acting.</li>
            <li className="flex gap-2"><span className="text-gold">▸</span> Talk to the poker site or any third party about your hand.</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            You are responsible for checking your site's Terms of Service. See <Link to="/disclaimer" className="text-gold underline">our disclaimer</Link>.
          </p>
        </Section>

        <div className="my-12 text-center">
          <Link to="/login" search={{ redirect: "/portal" }}><Button size="lg" className="font-bold">Open my portal →</Button></Link>
          <p className="mt-3 text-xs text-muted-foreground">Need help? File a ticket from the <Link to="/login" search={{ redirect: "/portal" }} className="text-gold underline">portal</Link> — we reply in-app, no email back-and-forth.</p>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) {
  return (
    <section className="arcane-border my-6 p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl arcane-gradient text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-display text-xl font-black">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 font-data text-xs font-bold text-gold">{i + 1}</span>
          <span className="text-muted-foreground">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Trouble({ symptom, fix }: { symptom: string; fix: string }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card/40 p-3">
      <div className="font-display text-sm font-bold">{symptom}</div>
      <p className="mt-1 text-xs text-muted-foreground">{fix}</p>
    </div>
  );
}
