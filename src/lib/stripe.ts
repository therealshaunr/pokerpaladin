import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete payment setup in the Lovable Payments dashboard to enable checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    getStripeEnvironment(); // throws if missing
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export const PRICE_CATALOG = {
  std_monthly: { tier: "STD", sku: "M001", label: "Standard · Monthly", price: "$79.99/mo" },
  std_yearly: { tier: "STD", sku: "Y001", label: "Standard · Yearly", price: "$799.90/yr" },
  pro_monthly: { tier: "PRO", sku: "M001", label: "Pro · Monthly", price: "$149.99/mo" },
  pro_yearly: { tier: "PRO", sku: "Y001", label: "Pro · Yearly", price: "$1,499.90/yr" },
  voice_monthly: { tier: "VOX", sku: "A001", label: "Voice Companion", price: "$10/mo" },
  lens_monthly: { tier: "LNS", sku: "A002", label: "Focus Lens", price: "$10/mo" },
  mobile_monthly: { tier: "MOB", sku: "A003", label: "Mobile Renderer", price: "$8/mo" },
  topup_10h_once: { tier: "TOP", sku: "T001", label: "10-Hour Go-Live Pack", price: "$14.99" },
} as const;

export type PriceId = keyof typeof PRICE_CATALOG;

// Pro tier includes 60 Go-Live hours; top-up pack adds 10. Standard has none.
export const GO_LIVE_INCLUDED_HOURS: Record<string, number> = {
  pro_monthly: 60,
  pro_yearly: 60,
  std_monthly: 0,
  std_yearly: 0,
  topup_10h_once: 10,
};
