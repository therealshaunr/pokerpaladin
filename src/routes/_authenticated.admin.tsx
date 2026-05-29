import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  amIAdmin,
  adminDashboard,
  adminListUsers,
  adminListReferrals,
  adminUpdateReferral,
  adminListTickets,
  adminToggleLicense,
} from "@/lib/admin.functions";
import { SupportInbox } from "@/components/SupportInbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, CreditCard, Gift, MessageSquare, Key, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(amIAdmin);
  const dash = useServerFn(adminDashboard);
  const usersFn = useServerFn(adminListUsers);
  const refsFn = useServerFn(adminListReferrals);
  const updateRef = useServerFn(adminUpdateReferral);
  const ticketsFn = useServerFn(adminListTickets);
  const toggleLic = useServerFn(adminToggleLicense);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminDashboard>> | null>(null);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminListUsers>>>([]);
  const [refs, setRefs] = useState<Awaited<ReturnType<typeof adminListReferrals>>>([]);
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof adminListTickets>>>([]);

  const reloadTickets = async () => setTickets(await ticketsFn());
  const reloadRefs = async () => setRefs(await refsFn());

  useEffect(() => {
    (async () => {
      const r = await checkAdmin();
      if (!r.isAdmin) {
        setAllowed(false);
        setTimeout(() => navigate({ to: "/portal" }), 1500);
        return;
      }
      setAllowed(true);
      const [d, u, rf, tk] = await Promise.all([dash(), usersFn(), refsFn(), ticketsFn()]);
      setData(d); setUsers(u); setRefs(rf); setTickets(tk);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (allowed === false) {
    return (
      <div className="matrix-bg min-h-dvh flex items-center justify-center">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-data text-sm text-muted-foreground">Admin only. Redirecting…</p>
        </div>
      </div>
    );
  }
  if (!allowed || !data) {
    return <div className="matrix-bg min-h-dvh flex items-center justify-center"><p className="font-data text-sm text-muted-foreground">Loading admin…</p></div>;
  }

  const pending = refs.filter((r) => r.status === "qualified").length;
  const openTickets = tickets.filter((t) => t.status !== "closed").length;

  return (
    <div className="matrix-bg min-h-dvh px-4 py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-black">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black">ADMIN<span className="text-gold"> CONSOLE</span></h1>
              <p className="font-data text-[11px] text-muted-foreground">Operations &amp; payouts</p>
            </div>
          </div>
          <Link to="/portal" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Portal
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <Stat label="Users" value={users.length} icon={Users} />
          <Stat label="Active subs" value={data.subscriptions.filter((s) => ["active", "trialing"].includes(s.status)).length} icon={CreditCard} />
          <Stat label="Payouts due" value={pending} icon={Gift} accent={pending > 0 ? "gold" : undefined} />
          <Stat label="Open tickets" value={openTickets} icon={MessageSquare} accent={openTickets > 0 ? "matrix" : undefined} />
        </section>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subs">Subscriptions</TabsTrigger>
            <TabsTrigger value="refs">Referrals {pending > 0 && <span className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] text-black">{pending}</span>}</TabsTrigger>
            <TabsTrigger value="tickets">Tickets {openTickets > 0 && <span className="ml-1 rounded-full bg-matrix px-1.5 py-0.5 text-[10px] text-black">{openTickets}</span>}</TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr><Th>Email</Th><Th>Name</Th><Th>Code</Th><Th>Referred by</Th><Th>Source</Th><Th>Joined</Th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/40 hover:bg-secondary/20">
                      <Td className="font-data text-xs">{u.email}</Td>
                      <Td>{u.display_name || u.name || "—"}</Td>
                      <Td className="font-data text-xs text-gold">{u.referral_code}</Td>
                      <Td className="font-data text-xs">{u.referred_by_code || "—"}</Td>
                      <Td className="text-xs">{u.how_heard || "—"}</Td>
                      <Td className="font-data text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="subs" className="mt-4">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr><Th>User</Th><Th>Tier</Th><Th>Status</Th><Th>Env</Th><Th>Renews</Th><Th>Go-Live used</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {data.subscriptions.map((s) => {
                    const u = users.find((x) => x.id === s.user_id);
                    return (
                      <tr key={s.id} className="border-b border-border/40 hover:bg-secondary/20">
                        <Td className="font-data text-xs">{u?.email || s.user_id.slice(0, 8)}</Td>
                        <Td className="capitalize">{s.tier} · {s.interval}</Td>
                        <Td><Badge tone={s.status === "active" ? "matrix" : s.status === "canceled" ? "muted" : "gold"}>{s.status}</Badge>{s.suspended && <Badge tone="red">susp</Badge>}{s.frozen && <Badge tone="muted">frozen</Badge>}</Td>
                        <Td><Badge tone={s.environment === "live" ? "matrix" : "muted"}>{s.environment}</Badge></Td>
                        <Td className="font-data text-xs">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</Td>
                        <Td className="font-data text-xs">{Math.round((s.go_live_seconds_used || 0) / 60)}m / {Math.round((s.go_live_seconds_included || 0) / 60)}m</Td>
                        <Td>
                          <Button size="sm" variant="ghost" onClick={async () => { await toggleLic({ data: { subscription_id: s.id, action: s.suspended ? "resume" : "suspend" } }); const d2 = await dash(); setData(d2); }} className="h-7 px-2 text-[11px]">
                            {s.suspended ? "Resume" : "Suspend"}
                          </Button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="refs" className="mt-4">
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-3 mb-3 text-xs text-muted-foreground">
              <span className="text-gold font-semibold">Payout queue:</span> referrals marked <strong>Qualified</strong> are owed a $25 Amazon gift card. Send it to the referrer's email, then mark Rewarded.
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr><Th>Referrer</Th><Th>Referee</Th><Th>Status</Th><Th>Signed up</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {refs.map((r) => (
                    <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/20">
                      <Td className="font-data text-xs">{r.referrer_email}<div className="text-muted-foreground">{r.referrer_name}</div></Td>
                      <Td className="font-data text-xs">{r.referee_email}</Td>
                      <Td><Badge tone={r.status === "rewarded" ? "matrix" : r.status === "qualified" ? "gold" : "muted"}>{r.status}</Badge></Td>
                      <Td className="font-data text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</Td>
                      <Td className="space-x-1">
                        {r.status === "pending" && <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-gold" onClick={async () => { await updateRef({ data: { id: r.id, status: "qualified" } }); await reloadRefs(); }}>Mark qualified</Button>}
                        {r.status === "qualified" && <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-matrix" onClick={async () => { await updateRef({ data: { id: r.id, status: "rewarded" } }); await reloadRefs(); }}>Mark rewarded</Button>}
                        {r.status !== "void" && r.status !== "rewarded" && <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-muted-foreground" onClick={async () => { await updateRef({ data: { id: r.id, status: "void" } }); await reloadRefs(); }}>Void</Button>}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="mt-4">
            <SupportInbox tickets={tickets} asAdmin onChange={reloadTickets} />
          </TabsContent>

          <TabsContent value="licenses" className="mt-4">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/40 text-left font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr><Th>Key</Th><Th>Tier</Th><Th>SKU</Th><Th>Status</Th><Th>User</Th><Th>Issued</Th></tr>
                </thead>
                <tbody>
                  {data.licenses.map((l) => {
                    const u = users.find((x) => x.id === l.user_id);
                    return (
                      <tr key={l.id} className="border-b border-border/40 hover:bg-secondary/20">
                        <Td className="font-data text-[11px] text-gold">{l.key}</Td>
                        <Td className="uppercase font-data text-xs">{l.tier_code}</Td>
                        <Td className="uppercase font-data text-xs">{l.sku}</Td>
                        <Td><Badge tone={l.status === "active" ? "matrix" : "muted"}>{l.status}</Badge></Td>
                        <Td className="font-data text-xs">{u?.email || l.user_id.slice(0, 8)}</Td>
                        <Td className="font-data text-xs text-muted-foreground">{new Date(l.issued_at).toLocaleDateString()}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Users; accent?: "gold" | "matrix" }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${accent === "gold" ? "border-gold/40" : accent === "matrix" ? "border-matrix/40" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent === "gold" ? "text-gold" : accent === "matrix" ? "text-matrix" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-1 font-display text-2xl font-black">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-2 font-semibold">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }
function Badge({ children, tone }: { children: React.ReactNode; tone: "matrix" | "gold" | "muted" | "red" }) {
  const cls = tone === "matrix" ? "bg-matrix/20 text-matrix border border-matrix/40"
    : tone === "gold" ? "bg-gold/20 text-gold border border-gold/40"
    : tone === "red" ? "bg-[oklch(0.58_0.22_27/0.2)] text-[oklch(0.7_0.2_27)] border border-[oklch(0.58_0.22_27/0.4)]"
    : "bg-secondary text-muted-foreground border border-border";
  return <span className={`mr-1 inline-block rounded-md px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-wider ${cls}`}>{children}</span>;
}
