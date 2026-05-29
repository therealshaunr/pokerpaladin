import { createServerFn } from "@tanstack/react-start";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type MerchLineInput = {
  name: string;
  description?: string;
  unitAmount: number; // cents (post-discount)
  quantity: number;
};

type MerchResult = { url: string } | { error: string };

// Ad-hoc Stripe Checkout for merch — accepts custom line_items via price_data
// so we don't need to pre-register every SKU/variant in Stripe.
export const createMerchCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      lines: MerchLineInput[];
      shippingCents: number;
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
      environment: StripeEnv;
    }) => {
      if (!Array.isArray(data.lines) || data.lines.length === 0) throw new Error("Cart is empty");
      if (data.lines.length > 50) throw new Error("Too many line items");
      for (const l of data.lines) {
        if (!l.name || l.name.length > 200) throw new Error("Invalid line name");
        if (!Number.isInteger(l.unitAmount) || l.unitAmount < 50 || l.unitAmount > 200000) throw new Error("Invalid unit amount");
        if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 50) throw new Error("Invalid quantity");
      }
      if (!Number.isInteger(data.shippingCents) || data.shippingCents < 0 || data.shippingCents > 50000) throw new Error("Invalid shipping");
      return data;
    },
  )
  .handler(async ({ data }): Promise<MerchResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const shippingOptions = [
        {
          shipping_rate_data: {
            display_name: data.shippingCents === 0 ? "Free shipping" : "Standard shipping",
            type: "fixed_amount" as const,
            fixed_amount: { amount: data.shippingCents, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day" as const, value: 5 },
              maximum: { unit: "business_day" as const, value: 10 },
            },
          },
        },
      ];

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "hosted",
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        automatic_tax: { enabled: true },
        shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "IE", "NZ"] },
        shipping_options: shippingOptions,
        ...(data.customerEmail && { customer_email: data.customerEmail }),
        line_items: data.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.unitAmount,
            tax_behavior: "exclusive" as const,
            product_data: {
              name: l.name,
              ...(l.description && { description: l.description }),
              tax_code: "txcd_30070003", // Apparel & accessories
            },
          },
        })),
      });

      return { url: session.url ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
