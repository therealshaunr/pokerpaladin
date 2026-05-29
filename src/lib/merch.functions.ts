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
      shippingMethod: "standard" | "expedited";
      donationCents?: number;
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
      if (data.shippingMethod !== "standard" && data.shippingMethod !== "expedited") throw new Error("Invalid shipping method");
      if (data.donationCents != null) {
        if (!Number.isInteger(data.donationCents) || data.donationCents < 0 || data.donationCents > 50000) {
          throw new Error("Invalid donation amount");
        }
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<MerchResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const isExpedited = data.shippingMethod === "expedited";
      const shippingOptions = [
        {
          shipping_rate_data: {
            display_name: isExpedited
              ? "USPS Expedited"
              : data.shippingCents === 0
              ? "USPS Standard (Free)"
              : "USPS Standard",
            type: "fixed_amount" as const,
            fixed_amount: { amount: data.shippingCents, currency: "usd" },
            delivery_estimate: isExpedited
              ? {
                  minimum: { unit: "business_day" as const, value: 2 },
                  maximum: { unit: "business_day" as const, value: 4 },
                }
              : {
                  minimum: { unit: "business_day" as const, value: 5 },
                  maximum: { unit: "business_day" as const, value: 10 },
                },
          },
        },
      ];

      const lineItems = data.lines.map((l) => ({
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
      }));

      // Charity donation rides as an extra line item — not taxed, not shippable,
      // a pure passthrough to Wounded Warrior Project.
      if (data.donationCents && data.donationCents > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: data.donationCents,
            tax_behavior: "exclusive" as const,
            product_data: {
              name: "Wounded Warrior Project Donation",
              description: "100% passthrough — supports the Wounded Warrior Project.",
              tax_code: "txcd_90020000", // Non-taxable donation
            },
          },
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        automatic_tax: { enabled: true },
        shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "IE", "NZ"] },
        shipping_options: shippingOptions,
        ...(data.customerEmail && { customer_email: data.customerEmail }),
        line_items: lineItems,
      });

      return { url: session.url ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
