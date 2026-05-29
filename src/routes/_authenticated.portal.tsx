import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { amIAdmin } from "@/lib/admin.functions";
import { SupportInbox } from "@/components/SupportInbox";
import { Button } from "@/components/ui/button";
import { Spade, LogOut, Play, Puzzle, Smartphone, Gift, Copy, Check, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  component: Portal,
});


interface Profile { name: string | null; display_name: string | null; phone: string | null; referral_code: string | null }
interface Sub { tier: string; interval: string; status: string; current_period_end: string | null; activation_id: string }
interface Referral { id: string; referee_email: string; status: string; created_at: string; qualified_at: string | null; rewarded_at: string | null }
function Portal() {
  const { user, signOut } = useAuth();
  const checkAdmin = useServerFn(amIAdmin);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkAdmin().then((r) => setIsAdmin(r.isAdmin)).catch(() => setIsAdmin(false));
    (async () => {
      const [{ data: p }, { data: s }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("name, display_name, phone, referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("tier, interval, status, current_period_end, activation_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("referrals").select("id, referee_email, status, created_at, qualified_at, rewarded_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(p as Profile | null);
      setSub(s as Sub | null);
      setReferrals((r as Referral[] | null) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const referralLink = profile?.referral_code
    ? `${window.location.origin}/login?mode=signup&ref=${profile.referral_code}`
    : "";

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin"><Button variant="secondary" size="sm" className="gap-2"><Shield className="h-4 w-4 text-gold" /> Admin</Button></Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>

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

        {/* Referral program */}
        <section className="rounded-2xl border border-gold/50 bg-gold/5 p-6">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-black uppercase tracking-wide">Refer a friend · earn $25</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your unique link. When a friend signs up with it and pays for at least one month of Paladin, you get a <span className="text-gold font-semibold">$25 digital Amazon gift card</span> — keep it, donate it, your call.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your referral code</div>
              <div className="font-data text-lg font-bold tracking-wider text-gold">{profile?.referral_code ?? "—"}</div>
            </div>
            <div className="flex-[2] rounded-lg border border-border bg-background/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Shareable link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate font-data text-xs text-foreground/80">{referralLink || "—"}</div>
                <button
                  onClick={copyLink}
                  disabled={!referralLink}
                  className="inline-flex items-center gap-1 rounded-md bg-gold px-2 py-1 text-[11px] font-bold text-black hover:opacity-90 disabled:opacity-40"
                >
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Active referrals ({referrals.length})
            </div>
            {referrals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card/40 px-3 py-4 text-center text-xs text-muted-foreground">
                No referrals yet. Share your link to start earning.
              </p>
            ) : (
              <div className="space-y-1.5">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
                    <div>
                      <div className="font-data text-sm text-foreground">{r.referee_email}</div>
                      <div className="font-data text-[10px] text-muted-foreground">
                        Signed up {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-wider ${r.status === "qualified" ? "bg-gold/20 text-gold border border-gold/40" : r.status === "rewarded" ? "bg-matrix/20 text-matrix border border-matrix/40" : "bg-secondary text-muted-foreground"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[10px] italic text-muted-foreground">
              Status updates after your friend's first paid month. Rewards are issued manually within 7 days — keep an eye on the email tied to your account.
            </p>
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

        <SupportInbox />

      </div>
    </div>
  );
}

