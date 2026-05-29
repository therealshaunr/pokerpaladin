import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, Smartphone, Share2, Plus, MoreVertical, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PocketQR } from "@/components/PocketQRCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pocket/install")({
  head: () => ({
    meta: [
      { title: "Install Paladin Pocket on your phone" },
      { name: "description", content: "Step-by-step install guide for Paladin Pocket on iOS and Android." },
    ],
  }),
  component: Install,
});

function Install() {
  const [os, setOs] = useState<"ios" | "android">("ios");
  const url = typeof window !== "undefined" ? `${window.location.origin}/pocket` : "";
  return (
    <main className="matrix-bg min-h-dvh px-4 py-10">
      <div className="relative z-10 mx-auto max-w-2xl">
        <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Portal
        </Link>
        <h1 className="mt-3 font-display text-3xl md:text-4xl font-black">
          Install <span className="text-wizard">Paladin Pocket</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pocket is a Progressive Web App — it installs directly from your browser. No App Store, no Play Store, no wait.
        </p>

        <div className="mt-6 flex justify-center">
          {url ? <PocketQR url={url} size={200} /> : null}
        </div>
        <p className="mt-2 text-center font-data text-xs text-muted-foreground break-all">{url}</p>

        <div className="mt-8 flex gap-2 rounded-xl border border-border bg-card p-1">
          <TabBtn active={os === "ios"} onClick={() => setOs("ios")}><Apple className="h-4 w-4" /> iPhone / iPad</TabBtn>
          <TabBtn active={os === "android"} onClick={() => setOs("android")}><Smartphone className="h-4 w-4" /> Android</TabBtn>
        </div>

        {os === "ios" && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">iOS · Safari</h2>
            <ol className="mt-4 space-y-3 text-sm">
              <Step n={1}>Scan the QR code above with your <span className="font-semibold">iPhone camera</span>. Tap the notification to open in <span className="text-gold font-semibold">Safari</span> (not Chrome — only Safari can install PWAs on iOS).</Step>
              <Step n={2}>Sign in with your Paladin email — same one you use on the desktop.</Step>
              <Step n={3}>Tap the <Share2 className="inline h-4 w-4 align-text-bottom" /> <span className="font-semibold">Share</span> button at the bottom of Safari.</Step>
              <Step n={4}>Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span> <Plus className="inline h-4 w-4 align-text-bottom" />.</Step>
              <Step n={5}>Tap <span className="font-semibold">Add</span>. Done — Paladin Pocket lives on your home screen and launches full-screen.</Step>
            </ol>
            <Callout>iOS quirk: each new sign-in/sign-out may require you to re-add the icon. iOS forgets PWA sessions aggressively.</Callout>
          </section>
        )}

        {os === "android" && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Android · Chrome</h2>
            <ol className="mt-4 space-y-3 text-sm">
              <Step n={1}>Scan the QR code with your phone camera. Tap to open in <span className="text-gold font-semibold">Chrome</span> (works in Edge & Brave too).</Step>
              <Step n={2}>Sign in with your Paladin email.</Step>
              <Step n={3}>Look for the <span className="font-semibold">"Install app"</span> banner at the bottom — tap it.</Step>
              <Step n={4}>If no banner: tap <MoreVertical className="inline h-4 w-4 align-text-bottom" /> menu → <span className="font-semibold">Install app</span> (or <span className="font-semibold">Add to Home screen</span>).</Step>
              <Step n={5}>Confirm. Pocket installs like any native app — show up in your app drawer and recent apps.</Step>
            </ol>
            <Callout>Chrome on Android remembers your sign-in across launches. Set it once and forget it.</Callout>
          </section>
        )}

        <div className="mt-6 grid gap-2 md:grid-cols-2">
          <Link to="/pocket"><Button variant="secondary" className="w-full">Open Pocket now</Button></Link>
          <Link to="/portal"><Button variant="ghost" className="w-full">Back to portal</Button></Link>
        </div>
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
      {children}
    </button>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-data text-[11px] font-bold text-gold">{n}</span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">{children}</p>;
}
