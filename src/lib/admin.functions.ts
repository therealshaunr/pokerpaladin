import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [subs, licenses, tickets, addons] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("id, user_id, tier, interval, status, environment, current_period_end, suspended, frozen, license_key, go_live_seconds_used, go_live_seconds_included, stripe_customer_id")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("license_keys")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("support_tickets")
        .select("*")
        .neq("status", "closed")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("addons")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      subscriptions: subs.data ?? [],
      licenses: licenses.data ?? [],
      tickets: tickets.data ?? [],
      addons: addons.data ?? [],
    };
  });

export const adminToggleLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        subscription_id: z.string().uuid(),
        action: z.enum(["suspend", "resume", "freeze", "unfreeze"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, boolean> = {};
    if (data.action === "suspend") patch.suspended = true;
    if (data.action === "resume") patch.suspended = false;
    if (data.action === "freeze") patch.frozen = true;
    if (data.action === "unfreeze") patch.frozen = false;
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(patch as never)
      .eq("id", data.subscription_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId,
      action: `subscription.${data.action}`,
      meta: { subscription_id: data.subscription_id },
    } as never);

    return { ok: true };
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, name, phone, referral_code, referred_by_code, how_heard, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    // Pull emails via auth admin api
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (profiles ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? "" }));
  });

export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: refs } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const referrerIds = Array.from(new Set((refs ?? []).map((r) => r.referrer_id)));
    const { data: profiles } = referrerIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, name").in("id", referrerIds)
      : { data: [] as { id: string; display_name: string | null; name: string | null }[] };
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.name || ""]));
    return (refs ?? []).map((r) => ({
      ...r,
      referrer_email: emailById.get(r.referrer_id) ?? "",
      referrer_name: nameById.get(r.referrer_id) ?? "",
    }));
  });

export const adminUpdateReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "qualified", "rewarded", "void"]),
        notes: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "qualified") patch.qualified_at = new Date().toISOString();
    if (data.status === "rewarded") patch.rewarded_at = new Date().toISOString();
    if (data.notes) patch.reward_notes = data.notes;
    const { error } = await supabaseAdmin.from("referrals").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId,
      action: `referral.${data.status}`,
      meta: { referral_id: data.id },
    } as never);
    return { ok: true };
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: tickets } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    const userIds = Array.from(new Set((tickets ?? []).map((t) => t.user_id)));
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (tickets ?? []).map((t) => ({ ...t, user_email: emailById.get(t.user_id) ?? "" }));
  });

export const adminCloseTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({ status: "closed" } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

