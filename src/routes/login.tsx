import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spade } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/portal",
  }),
  component: Login,
});

function Login() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
            data: { name, phone, display_name: name || email.split("@")[0] },
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
