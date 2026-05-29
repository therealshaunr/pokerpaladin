import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "./index";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Poker Paladin" },
      { name: "description", content: "7-day money-back guarantee on Poker Paladin subscriptions and add-ons. How to request and what happens to your account." },
    ],
  }),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <header className="py-12 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">Refund Policy</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">7-day, <span className="text-wizard">no-questions-asked</span>.</h1>
        </header>

        <section className="arcane-border p-6 md:p-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            If you signed our <Link to="/disclaimer" className="text-gold underline">disclaimer</Link> at signup and you are within <span className="text-foreground font-semibold">7 days</span> of your initial purchase, you are entitled to a full refund of that purchase — no justification required.
          </p>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">How to request</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Sign in to your portal.</li>
              <li>Open a support ticket with category <span className="font-data text-gold">Billing</span>.</li>
              <li>Tell us the order date and the plan/add-on you want refunded.</li>
            </ol>
            <p className="mt-2">An admin will process the refund within 3 business days. The original payment method is refunded automatically by Stripe or PayPal.</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">What happens to your account</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your license key is revoked and your plan/add-on entitlements are removed within minutes of the refund.</li>
              <li>If you bought one-time Go-Live Hour Packs, any unused hours are forfeited on refund.</li>
              <li>Your hand history is retained for 30 days in case you change your mind, then permanently deleted.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">After 7 days</h2>
            <p className="mt-2">Subscriptions can be cancelled at any time from your portal — you'll keep access until the end of the current billing period and will not be charged again. Pro-rated refunds outside the 7-day window are at our discretion, typically only granted for documented service outages.</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Chargebacks</h2>
            <p className="mt-2">Please open a ticket before disputing a charge. Chargebacks filed without first contacting us result in immediate, permanent account termination across all our services.</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Crypto payments</h2>
            <p className="mt-2">Crypto payments made via our Changelly affiliate (when available) are refunded in USD value to a payout method of your choice (PayPal preferred). Network fees are not refunded.</p>
          </div>
        </section>

        <div className="my-10 text-center text-sm text-muted-foreground">
          Questions? <Link to="/login" search={{ redirect: "/portal" }} className="text-gold underline">Sign in</Link> and open a billing ticket.
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
