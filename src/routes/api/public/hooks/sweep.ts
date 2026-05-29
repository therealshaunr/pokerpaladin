import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Nightly housekeeping. Triggered by pg_cron.
// - resets Go-Live seconds counters at the start of each billing period
// - expires 90-day add-on packs (e.g. 10-Hour Pack)
// - flags subscriptions over their included Go-Live allowance
export const Route = createFileRoute("/api/public/hooks/sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") || request.headers.get("apikey") || "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY || "";
        if (!expected || (!auth.includes(expected) && request.headers.get("apikey") !== expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const now = new Date().toISOString();
        const results: Record<string, number> = {};

        // 1. Reset Go-Live seconds for subs whose current_period_end has passed.
        const { data: rolled } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .lt("current_period_end", now)
          .gt("go_live_seconds_used", 0);
        if (rolled?.length) {
          const ids = rolled.map((r) => r.id);
          await supabaseAdmin.from("subscriptions").update({ go_live_seconds_used: 0 } as never).in("id", ids);
          results.rolled = ids.length;
        }

        // 2. Expire 90-day add-on packs.
        const { data: expired } = await supabaseAdmin
          .from("addons")
          .select("id")
          .lt("expires_at", now)
          .eq("status", "active");
        if (expired?.length) {
          const ids = expired.map((r) => r.id);
          await supabaseAdmin.from("addons").update({ status: "canceled" } as never).in("id", ids);
          results.expired = ids.length;
        }

        // 3. Flag overage (used > included). Front-end shows an upsell banner from `frozen=false, suspended=false` + computed overage.
        const { data: subs } = await supabaseAdmin
          .from("subscriptions")
          .select("id, go_live_seconds_used, go_live_seconds_included, suspended")
          .in("status", ["active", "trialing"]);
        let overage = 0;
        for (const s of subs ?? []) {
          if ((s.go_live_seconds_used || 0) > (s.go_live_seconds_included || 0) && !s.suspended) overage++;
        }
        results.overage_flagged = overage;

        await supabaseAdmin.from("audit_log").insert({
          actor_id: null,
          action: "cron.sweep",
          meta: results,
        } as never);

        return new Response(JSON.stringify({ ok: true, ...results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
