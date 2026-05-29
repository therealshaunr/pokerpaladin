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
      .update(patch)
      .eq("id", data.subscription_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId,
      action: `subscription.${data.action}`,
      meta: { subscription_id: data.subscription_id },
    });
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
