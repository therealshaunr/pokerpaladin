import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Heart, Flag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav, SiteFooter } from "./index";
import { PaladinWordmark } from "@/components/PaladinWordmark";
import { VeteranBadge } from "@/components/VeteranBadge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Veteran Owned — Poker Paladin" },
      {
        name: "description",
        content:
          "Poker Paladin is veteran owned and built. A U.S. Air Force veteran's late-night idea at the felt, now a co-pilot for serious players. A portion of every order supports the Wounded Warrior Project.",
      },
      { property: "og:title", content: "About Poker Paladin — Veteran Owned" },
      {
        property: "og:description",
        content: "Veteran built. Brother-backed. Never leave a brother behind.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16">
        <header className="py-12 text-center">
          <PaladinWordmark size="lg" subtitle="About · Our Story" />
        </header>

        <section className="arcane-border p-8 text-center">
          <Flag className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 font-display text-3xl font-black md:text-4xl">
            Veteran Owned. Built at the <span className="text-gold">Table.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Poker Paladin started as a late-night idea during an online tournament —
            the kind of read you only get from years of watching humans bet, bluff,
            and break under pressure. Less than a day later, a concept. A week later,
            a working co-pilot. The Paladin is here for the players who read the
            room before they read the cards.
          </p>
        </section>

        <section className="my-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <Sparkles className="h-6 w-6 text-wizard" />
            <h3 className="mt-3 font-display text-xl font-black uppercase tracking-wide">
              About the Founder
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <em className="text-foreground">[Founder bio placeholder]</em> — U.S.
              Air Force veteran. Poker player. Engineer. Father. The full story —
              service record, the moment at the felt that sparked the Paladin, and
              where this project is going next — drops here soon.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Want to share your story or contribute? Open a ticket from your portal.
            </p>
          </div>
          <VeteranBadge />
        </section>

        <section className="rounded-2xl border border-wizard/40 bg-gradient-to-br from-wizard/10 via-card to-transparent p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-wizard/50 bg-wizard/15">
              <Heart className="h-5 w-5 text-wizard" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black uppercase tracking-wide">
                Wounded Warrior Project
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A portion of every sale — merch <em>and</em> subscriptions — is
                contributed to the{" "}
                <a
                  href="https://www.woundedwarriorproject.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wizard underline"
                >
                  Wounded Warrior Project
                </a>
                . At checkout, you can add your own donation on top — 100% of that
                amount passes through.
              </p>
            </div>
          </div>
        </section>

        <section className="my-8 rounded-2xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
          <h3 className="mt-2 font-display text-lg font-black uppercase tracking-wide">
            "Never leave a brother behind."
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We volunteer at our local VA. We answer support tickets ourselves. If
            you're a veteran and need help with the app, say so in your ticket — we'll take care of you.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/shop">
              <Button size="lg" className="font-bold">
                Shop the Armory
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="secondary">
                See Plans
              </Button>
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
