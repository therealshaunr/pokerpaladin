import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };
type PortalResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  opts: { email?: string; userId?: string },
): Promise<string> {
  if (opts.userId && !/^[a-zA-Z0-9_-]+$/.test(opts.userId)) throw new Error("Invalid userId");
  if (opts.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${opts.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (opts.email) {
    const existing = await stripe.customers.list({ email: opts.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (opts.userId && customer.metadata?.userId !== opts.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: opts.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(opts.email && { email: opts.email }),
    ...(opts.userId && { metadata: { userId: opts.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      userId?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, { email: data.customerEmail, userId: data.userId })
          : undefined;

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        productDescription = product.name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        ...(customerId && { customer: customerId }),
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        ...(data.userId && {
          metadata: { userId: data.userId, priceLookup: data.priceId },
          ...(isRecurring && {
            subscription_data: { metadata: { userId: data.userId, priceLookup: data.priceId } },
          }),
        }),
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found yet — complete a purchase first." };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// Pull the user's current subscription, addons, license keys, and Go-Live usage.
export const getPortalSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [subRes, addonRes, licRes, usageRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("addons")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false }),
      supabase
        .from("license_keys")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false }),
      supabase.rpc("get_go_live_usage", { _user_id: userId }),
    ]);
    const usage = Array.isArray(usageRes.data) ? usageRes.data[0] : usageRes.data;
    return {
      subscription: subRes.data,
      addons: addonRes.data ?? [],
      licenses: licRes.data ?? [],
      usage: usage ?? { seconds_used: 0, hours_used: 0, period_start: new Date().toISOString() },
    };
  });
