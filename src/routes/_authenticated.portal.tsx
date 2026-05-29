import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Spade, LogOut, Play, Puzzle, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  component: Portal,
});

interface Profile { name: string | null; display_name: string | null; phone: string | null }
interface Sub { tier: string; interval: string; status: string; current_period_end: string | null; activation_id: string }

function Portal() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("name, display_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("tier, interval, status, current_period_end, activation_id").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(p as Profile | null);
      setSub(s as Sub | null);
    })();
  }, [user]);

  return (
    <div className="matrix-bg min-h-dvh px-4 py-8">
      <div className="relative z-10 mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Spade className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black">POKER<span className="text-matrix"> PALADIN</span></h1>
              <p className="font-data text-[11px] text-muted-foreground">Member portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Account</div>
              <div className="mt-1 font-display text-lg font-bold">{profile?.display_name || profile?.name || user?.email}</div>
              <div className="font-data text-xs text-muted-foreground">{user?.email}</div>
              {profile?.phone && <div className="font-data text-xs text-muted-foreground">{profile.phone}</div>}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Plan</div>
              <div className="mt-1 font-display text-lg font-bold capitalize">
                {sub ? `${sub.tier} · ${sub.interval}` : "No active plan"}
              </div>
              <div className="font-data text-xs text-muted-foreground capitalize">
                Status: {sub?.status ?? "—"}
                {sub?.current_period_end && ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}`}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Activation ID</div>
              <div className="mt-1 font-data text-xs break-all text-matrix">{sub?.activation_id ?? "—"}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link to="/app" className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary">
            <Play className="h-6 w-6 text-matrix" />
            <div className="mt-3 font-display text-lg font-bold">Launch Paladin</div>
            <p className="mt-1 text-xs text-muted-foreground">Open the live analyzer. Share your poker screen and get real-time guidance.</p>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-6 opacity-60">
            <Puzzle className="h-6 w-6" />
            <div className="mt-3 font-display text-lg font-bold">Extension</div>
            <p className="mt-1 text-xs text-muted-foreground">Browser companion — coming soon ($10/mo add-on).</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 opacity-60">
            <Smartphone className="h-6 w-6" />
            <div className="mt-3 font-display text-lg font-bold">Mobile view</div>
            <p className="mt-1 text-xs text-muted-foreground">Pair your phone to mirror the recommendation — coming soon.</p>
          </div>
        </section>

        <p className="text-center font-data text-[11px] text-muted-foreground">
          Billing & subscription management coming in the next update.
        </p>
      </div>
    </div>
  );
}
