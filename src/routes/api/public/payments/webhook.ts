import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { GO_LIVE_INCLUDED_HOURS, PRICE_CATALOG } from "@/lib/stripe";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

// Map a Stripe price lookup_key to the tier/sku used in license keys.
function resolveCatalog(lookupKey: string | null | undefined) {
  if (!lookupKey) return null;
  return (PRICE_CATALOG as Record<string, { tier: string; sku: string; label: string }>)[lookupKey] || null;
}

async function issueLicenseKey(params: {
  userId: string;
  priceLookup: string;
  productId?: string | null;
  subscriptionId?: string | null;
  addonId?: string | null;
}) {
  const cat = resolveCatalog(params.priceLookup);
  if (!cat) {
    console.error("No catalog entry for", params.priceLookup);
    return null;
  }
  const sb = getSupabase();
  const { data: keyRow, error: kErr } = await sb.rpc("generate_license_key", { _tier: cat.tier, _sku: cat.sku });
  if (kErr || !keyRow) {
    console.error("Failed to generate license", kErr);
    return null;
  }
  const license = String(keyRow);
  const { error: insErr } = await sb.from("license_keys").insert({
    user_id: params.userId,
    key: license,
    tier_code: cat.tier,
    sku: cat.sku,
    price_id: params.priceLookup,
    product_id: params.productId ?? null,
    subscription_id: params.subscriptionId ?? null,
    addon_id: params.addonId ?? null,
  });
  if (insErr) console.error("Failed to log license_key", insErr);
  return license;
}

function inferTierInterval(lookup: string): { tier: string; interval: string } {
  if (lookup.startsWith("pro_")) return { tier: "pro", interval: lookup.endsWith("yearly") ? "yearly" : "monthly" };
  if (lookup.startsWith("std_")) return { tier: "standard", interval: lookup.endsWith("yearly") ? "yearly" : "monthly" };
  return { tier: "standard", interval: "monthly" };
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("subscription event with no userId metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceLookup: string =
    item?.price?.lookup_key ||
    subscription.metadata?.priceLookup ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id;
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tierInterval = inferTierInterval(priceLookup);

  const sb = getSupabase();
  const isPlanPrice = priceLookup?.startsWith("pro_") || priceLookup?.startsWith("std_");

  if (isPlanPrice) {
    // Look up any existing row for this Stripe subscription so we can preserve its license key on updates.
    const { data: existing } = await sb
      .from("subscriptions")
      .select("id, license_key")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    const includedHours = GO_LIVE_INCLUDED_HOURS[priceLookup] ?? 0;
    const upsertRow: any = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_sub_id: subscription.id, // legacy alias
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceLookup,
      tier: tierInterval.tier,
      interval: tierInterval.interval,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      go_live_seconds_included: includedHours * 3600,
      variant: tierInterval.tier, // existing column requires this
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await sb
      .from("subscriptions")
      .upsert(upsertRow, { onConflict: "stripe_subscription_id" })
      .select("id, license_key")
      .single();
    if (error || !row) {
      console.error("subscription upsert failed", error);
      return;
    }
    // Issue license key only on first activation
    if (!row.license_key && (subscription.status === "active" || subscription.status === "trialing")) {
      const key = await issueLicenseKey({
        userId,
        priceLookup,
        productId,
        subscriptionId: row.id,
      });
      if (key) {
        await sb.from("subscriptions").update({ license_key: key }).eq("id", row.id);
      }
    }
  } else {
    // Add-on subscription (voice, lens, mobile)
    const kindMap: Record<string, string> = { voice_monthly: "voice", lens_monthly: "lens", mobile_monthly: "mobile" };
    const kind = kindMap[priceLookup] ?? "other";
    const { data: existing } = await sb
      .from("addons")
      .select("id, license_key")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    const row: any = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_sub_id: subscription.id,
      kind,
      status: subscription.status,
      price_id: priceLookup,
      product_id: productId,
      environment: env,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let addonId = existing?.id;
    if (existing) {
      await sb.from("addons").update(row).eq("id", existing.id);
    } else {
      const { data: ins } = await sb.from("addons").insert(row).select("id").single();
      addonId = ins?.id;
    }

    if (!existing?.license_key && addonId && (subscription.status === "active" || subscription.status === "trialing")) {
      const key = await issueLicenseKey({ userId, priceLookup, productId, addonId });
      if (key) await sb.from("addons").update({ license_key: key }).eq("id", addonId);
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const sb = getSupabase();
  await sb
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  await sb
    .from("addons")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // One-time purchases (top-up packs) don't create a subscription — handle here.
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const priceLookup = session.metadata?.priceLookup;
  if (!userId || !priceLookup) return;
  const sb = getSupabase();
  // Insert an addon row for the top-up with 90-day expiry
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: ins } = await sb
    .from("addons")
    .insert({
      user_id: userId,
      kind: "topup",
      status: "active",
      price_id: priceLookup,
      environment: env,
      expires_at: expires,
    })
    .select("id")
    .single();
  if (ins) {
    const key = await issueLicenseKey({ userId, priceLookup, addonId: ins.id });
    if (key) await sb.from("addons").update({ license_key: key }).eq("id", ins.id);
    // Add 10h to the active Pro plan's included seconds
    const extraHours = GO_LIVE_INCLUDED_HOURS[priceLookup] ?? 0;
    if (extraHours > 0) {
      const { data: activeSub } = await sb
        .from("subscriptions")
        .select("id, go_live_seconds_included")
        .eq("user_id", userId)
        .eq("environment", env)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeSub) {
        await sb
          .from("subscriptions")
          .update({ go_live_seconds_included: (Number(activeSub.go_live_seconds_included) || 0) + extraHours * 3600 })
          .eq("id", activeSub.id);
      }
    }
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
