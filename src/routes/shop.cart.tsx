import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav, SiteFooter } from "./index";
import { CartProvider, useCart, fmtPrice } from "@/lib/cart";
import { productBySlug, BUNDLE_DISCOUNT_PCT, BUNDLE_DISCOUNT_THRESHOLD, CUSTOMIZATION_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/merch/catalog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { createMerchCheckout } from "@/lib/merch.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { ShoppingBag, Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/shop/cart")({
  component: () => (
    <CartProvider>
      <CartPage />
    </CartProvider>
  ),
});

function CartPage() {
  const { lines, setQty, remove, totals, clear } = useCart();
  const { user } = useAuth();
  const checkout = useServerFn(createMerchCheckout);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startCheckout = async () => {
    setBusy(true); setErr(null);
    try {
      // Apply bundle discount proportionally across line items so Stripe totals match.
      const discountFactor = totals.subtotal > 0 ? totals.afterDiscount / totals.subtotal : 1;
      const stripeLines = lines.map((l) => {
        const p = productBySlug(l.slug)!;
        const baseUnit = p.price + (l.customText ? CUSTOMIZATION_FEE : 0);
        const adjusted = Math.max(50, Math.round(baseUnit * discountFactor));
        const descParts = [l.fit, l.color, l.size && `Size ${l.size}`, l.customText && `Custom: "${l.customText}"`].filter(Boolean);
        return {
          name: p.name,
          description: descParts.join(" · ") || undefined,
          unitAmount: adjusted,
          quantity: l.qty,
        };
      });

      const env = getStripeEnvironment();
      const origin = window.location.origin;
      const result = await checkout({
        data: {
          lines: stripeLines,
          shippingCents: totals.shipping,
          successUrl: `${origin}/shop/cart?status=success`,
          cancelUrl: `${origin}/shop/cart?status=cancelled`,
          customerEmail: user?.email,
          environment: env,
        },
      });
      if ("error" in result) throw new Error(result.error);
      window.location.href = result.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  };

  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16">
        <div className="flex items-center justify-between py-4">
          <Link to="/shop" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Continue shopping
          </Link>
          <h1 className="font-display text-xl font-black uppercase tracking-wide">Cart</h1>
        </div>

        {lines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">Your cart is empty</p>
            <Link to="/shop" className="mt-4 inline-block text-sm text-gold underline">Browse the armory</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {lines.map((l) => {
                const p = productBySlug(l.slug);
                if (!p) return null;
                const unit = p.price + (l.customText ? CUSTOMIZATION_FEE : 0);
                return (
                  <div key={l.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
                    <div className="h-20 w-20 shrink-0 rounded-lg border border-border bg-secondary/30" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display text-base font-bold">{p.name}</div>
                          <div className="font-data text-[11px] text-muted-foreground uppercase tracking-wider">
                            {[l.fit, l.color, l.size && `Size ${l.size}`].filter(Boolean).join(" · ")}
                          </div>
                          {l.customText && <div className="font-data text-[11px] text-gold">Custom: "{l.customText}"</div>}
                        </div>
                        <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-md border border-border">
                          <button onClick={() => setQty(l.id, l.qty - 1)} className="h-8 w-8 text-sm font-bold">−</button>
                          <span className="w-8 text-center font-data text-sm">{l.qty}</span>
                          <button onClick={() => setQty(l.id, l.qty + 1)} className="h-8 w-8 text-sm font-bold">+</button>
                        </div>
                        <div className="font-data text-sm font-bold text-gold">{fmtPrice(unit * l.qty)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">Clear cart</button>
            </div>

            <aside className="h-fit rounded-2xl border border-gold/40 bg-card p-5 shadow-[0_0_40px_-20px_rgba(212,175,76,0.4)]">
              <h2 className="font-display text-lg font-black uppercase tracking-wide">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={fmtPrice(totals.subtotal)} />
                {totals.bundleDiscount > 0 ? (
                  <Row k={`Bundle (${BUNDLE_DISCOUNT_PCT}% off ${BUNDLE_DISCOUNT_THRESHOLD}+ items)`} v={`− ${fmtPrice(totals.bundleDiscount)}`} highlight />
                ) : (
                  <p className="text-[11px] text-muted-foreground">Add {BUNDLE_DISCOUNT_THRESHOLD - totals.itemCount} more item{BUNDLE_DISCOUNT_THRESHOLD - totals.itemCount === 1 ? "" : "s"} for {BUNDLE_DISCOUNT_PCT}% off.</p>
                )}
                <Row k={totals.freeShipping ? "Shipping (FREE · insured)" : "Shipping"} v={totals.shipping === 0 ? "FREE" : fmtPrice(totals.shipping)} highlight={totals.freeShipping} />
                {!totals.freeShipping && (
                  <p className="text-[11px] text-muted-foreground">Spend {fmtPrice(FREE_SHIPPING_THRESHOLD - totals.afterDiscount)} more for free shipping + insurance.</p>
                )}
                <div className="border-t border-border pt-2">
                  <Row k="Total" v={fmtPrice(totals.grand)} bold />
                </div>
              </dl>

              {err && <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{err}</p>}

              <Button className="mt-5 w-full font-bold" size="lg" onClick={startCheckout} disabled={busy}>
                {busy ? "Opening checkout…" : "Checkout securely →"}
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Tax calculated at checkout. Customized items add ~1 week.</p>
            </aside>
          </div>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}

function Row({ k, v, bold, highlight }: { k: string; v: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={`${bold ? "font-display font-bold" : "text-muted-foreground"}`}>{k}</dt>
      <dd className={`font-data ${bold ? "text-lg font-black" : ""} ${highlight ? "text-gold font-bold" : ""}`}>{v}</dd>
    </div>
  );
}
