import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { subscribeVerdict, type PocketVerdict } from "@/lib/pocket-channel";
import { Button } from "@/components/ui/button";
import { Spade, WifiOff, Radio, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pocket")({
  head: () => ({
    meta: [
      { title: "Paladin Pocket — Mobile verdict mirror" },
      { name: "description", content: "Glance-only view of your live Paladin verdicts." },
      { name: "theme-color", content: "#7c3aed" },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: Pocket,
});

const VERDICT_TONE: Record<string, string> = {
  Fold: "bg-[oklch(0.35_0.02_160)] text-foreground border-border",
  Check: "bg-secondary text-foreground border-border",
  Call: "bg-[oklch(0.8_0.14_95)] text-black border-gold",
  Bet: "bg-matrix text-black border-matrix",
  Raise: "wizard-gradient text-white border-wizard",
  Shove: "bg-[oklch(0.58_0.22_27)] text-white border-destructive",
};

function Pocket() {
  const { user, loading } = useAuth();
  const [v, setV] = useState<PocketVerdict | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!user) return;
    const off = subscribeVerdict(user.id, (msg) => { setV(msg); setStale(false); });
    return off;
  }, [user]);

  // Mark stale after 30s without a new verdict
  useEffect(() => {
    if (!v) return;
    const t = setTimeout(() => setStale(true), 30_000);
    return () => clearTimeout(t);
  }, [v]);

  if (loading) {
    return <div className="min-h-dvh bg-black flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: "/pocket" } as never });
  }

  return (
    <main className="matrix-bg min-h-dvh px-4 py-6 text-foreground select-none">
      <div className="relative z-10 mx-auto max-w-sm space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Spade className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-black leading-none">PALADIN<span className="text-matrix"> POCKET</span></div>
              <div className="font-data text-[10px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 font-data text-[10px] uppercase tracking-wider",
            v && !stale ? "border-matrix/50 text-matrix" : "border-border text-muted-foreground")}>
            {v && !stale ? <><Radio className="h-3 w-3 animate-pulse" /> Live</> : <><WifiOff className="h-3 w-3" /> Idle</>}
          </div>
        </header>

        {!v && (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <Smartphone className="mx-auto h-10 w-10 text-gold/70" />
            <p className="mt-3 font-display text-lg font-bold">Waiting for the desktop…</p>
            <p className="mt-1 text-xs text-muted-foreground">Open Paladin on your computer and start a hand. Verdicts mirror here within a beat.</p>
            <Link to="/portal" className="mt-4 inline-block">
              <Button size="sm" variant="secondary">Back to portal</Button>
            </Link>
          </div>
        )}

        {v && (
          <>
            <div className={cn("rounded-2xl border-2 p-6 text-center shadow-[0_0_60px_-20px_currentColor] transition", VERDICT_TONE[v.verdict] ?? VERDICT_TONE.Check, stale && "opacity-50")}>
              <div className="font-data text-[10px] font-bold uppercase tracking-[0.35em] opacity-80">
                Paladin says {stale && "· stale"}
              </div>
              <div className="mt-2 font-display text-5xl font-black uppercase leading-none">
                {v.verdict}
                {v.suggestedSize && (v.verdict === "Bet" || v.verdict === "Raise") && (
                  <div className="mt-1 font-data text-lg font-bold opacity-90">{v.suggestedSize}</div>
                )}
              </div>
              <div className="mt-3 text-sm font-semibold opacity-90">{v.headline}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <PocketStat label="Equity" value={`${(v.equity * 100).toFixed(0)}%`} />
              <PocketStat label="Need" value={v.requiredEquity > 0 ? `${(v.requiredEquity * 100).toFixed(0)}%` : "—"} />
              <PocketStat label="EV" value={`${v.evCall >= 0 ? "+" : ""}${v.evCall.toFixed(0)}`} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PocketStat label="Pot" value={`${v.pot}`} />
              <PocketStat label="To call" value={`${v.toCall}`} />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">Hand · {v.street}</div>
              <div className="mt-1 flex gap-1 font-display text-2xl font-black">
                {v.hero.map((c, i) => <CardChip key={`h${i}`} card={c} />)}
                <span className="mx-1 text-muted-foreground">|</span>
                {v.board.length === 0 ? <span className="text-muted-foreground text-base font-normal">preflop</span> : v.board.map((c, i) => <CardChip key={`b${i}`} card={c} />)}
              </div>
              {v.detail && <p className="mt-2 text-xs text-muted-foreground">{v.detail}</p>}
            </div>

            <p className="text-center font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {new Date(v.ts).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function PocketStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="font-display text-xl font-black">{value}</div>
      <div className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function CardChip({ card }: { card: string }) {
  const r = card.slice(0, card.length - 1);
  const s = card.slice(-1);
  const red = s === "h" || s === "d" || s === "♥" || s === "♦";
  const symbol = s === "h" ? "♥" : s === "d" ? "♦" : s === "c" ? "♣" : s === "s" ? "♠" : s;
  return (
    <span className={cn("inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5",
      red ? "text-[oklch(0.68_0.24_27)]" : "text-foreground")}>
      {r}{symbol}
    </span>
  );
}
