import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Spade } from "lucide-react";

const HEARD_OPTIONS = [
  "Friend / personal referral",
  "Reddit",
  "YouTube",
  "Twitter / X",
  "Twitch",
  "Discord",
  "Google search",
  "Podcast",
  "Other",
];

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/portal",
    ref: typeof s.ref === "string" ? s.ref.toUpperCase().slice(0, 12) : undefined,
    mode: s.mode === "signup" ? "signup" : undefined,
  }),
  component: Login,
});

function Login() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(search.mode === "signup" || search.ref ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [howHeard, setHowHeard] = useState<string>("");
  const [referredBy, setReferredBy] = useState<string>(search.ref ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: search.redirect || "/portal" });
  }, [user, navigate, search.redirect]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/portal",
            data: {
              name,
              phone,
              display_name: name || email.split("@")[0],
              how_heard: howHeard || null,
              referred_by_code: referredBy.trim().toUpperCase() || null,
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    // Stash referral code so we can attach it after OAuth round-trip (handled by portal).
    if (mode === "signup" && referredBy) {
      try { window.localStorage.setItem("paladin.pending_ref", referredBy.trim().toUpperCase()); } catch { /* ignore */ }
    }
    if (mode === "signup" && howHeard) {
      try { window.localStorage.setItem("paladin.pending_how_heard", howHeard); } catch { /* ignore */ }
    }
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/portal" });
    if (res.error) setErr(res.error.message);
  };

  return (
    <div className="matrix-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Spade className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">
            POKER<span className="text-matrix"> PALADIN</span>
          </h1>
          <p className="font-data text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your portal" : "Create your account"}
          </p>
        </div>

        {mode === "signup" && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-gold/5 p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gold">
              <Gift className="h-4 w-4" />
              <span className="font-display text-sm font-bold uppercase tracking-wide">Refer a friend = $25</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Every friend you refer who pays for one month of Paladin earns you a <span className="text-gold font-semibold">$25 digital Amazon gift card</span>. Grab your unique referral link from your portal after sign-up.
            </p>
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <Button onClick={onGoogle} variant="secondary" className="w-full">Continue with Google</Button>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </>
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">How did you hear about us?</label>
                  <Select value={howHeard} onValueChange={setHowHeard}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pick one" /></SelectTrigger>
                    <SelectContent>
                      {HEARD_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Referral code (optional)</label>
                  <Input
                    placeholder="PALADIN-XXXXXXXX"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="mt-1 font-data uppercase tracking-wider"
                  />
                  <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                    Leave blank if you don't have one — <span className="text-gold/90">referral codes can't be added after purchase.</span>
                  </p>
                </div>
              </>
            )}
            {err && <p className="font-data text-xs text-destructive">{err}</p>}
            <Button type="submit" disabled={busy} className="w-full font-bold">
              {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
