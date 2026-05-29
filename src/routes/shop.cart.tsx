import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav, SiteFooter } from "./index";
import { CartProvider, useCart, fmtPrice, lineUnitPrice } from "@/lib/cart";
import {
  productBySlug,
  BUNDLE_DISCOUNT_PCT,
  BUNDLE_DISCOUNT_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
  EXPEDITED_SHIPPING,
  isOversize,
  OVERSIZE_UPCHARGE_PCT,
} from "@/lib/merch/catalog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { createMerchCheckout } from "@/lib/merch.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { ShoppingBag, Trash2, ArrowLeft, Truck, Zap } from "lucide-react";
import { VeteranBadge } from "@/components/VeteranBadge";
import { CharityDonation } from "@/components/CharityDonation";
import { CartUpsell } from "@/components/CartUpsell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/cart")({
  component: () => (
    <CartProvider>
      <CartPage />
    </CartProvider>
  ),
});

function CartPage() {
  const {
    lines, setQty, remove, totals, clear,
    shippingMethod, setShippingMethod,
    donationCents, setDonationCents,
  } = useCart();
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
        const baseUnit = lineUnitPrice(l);
        const adjusted = Math.max(50, Math.round(baseUnit * discountFactor));
        const descParts = [
          l.fit,
          l.color,
          l.size && `Size ${l.size}${isOversize(l.size) ? ` (+${OVERSIZE_UPCHARGE_PCT}%)` : ""}`,
          l.customText && `Custom: "${l.customText}"`,
        ].filter(Boolean);
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
          shippingMethod,
          donationCents: donationCents > 0 ? donationCents : undefined,
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
            <div className="space-y-4">
              <CartUpsell />

              <div className="space-y-3">
                {lines.map((l) => {
                  const p = productBySlug(l.slug);
                  if (!p) return null;
                  const unit = lineUnitPrice(l);
                  return (
                    <div key={l.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
                      <div className="h-20 w-20 shrink-0 rounded-lg border border-border bg-secondary/30" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-display text-base font-bold">{p.name}</div>
                            <div className="font-data text-[11px] text-muted-foreground uppercase tracking-wider">
                              {[l.fit, l.color, l.size && `Size ${l.size}`].filter(Boolean).join(" · ")}
                              {isOversize(l.size) && (
                                <span className="ml-1 text-gold">· +{OVERSIZE_UPCHARGE_PCT}%</span>
                              )}
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

              {/* Shipping method */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gold" />
                  <h3 className="font-display text-sm font-black uppercase tracking-wide">Shipping method</h3>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ShipOption
                    active={shippingMethod === "standard"}
                    onClick={() => setShippingMethod("standard")}
                    icon={Truck}
                    name="USPS Standard"
                    eta="5–10 business days"
                    price={totals.freeShipping && shippingMethod === "standard" ? "FREE" : fmtPrice(STANDARD_SHIPPING)}
                    note={
                      totals.afterDiscount >= FREE_SHIPPING_THRESHOLD
                        ? "Free at $100+ — you qualify."
                        : `Free at ${fmtPrice(FREE_SHIPPING_THRESHOLD)} subtotal.`
                    }
                  />
                  <ShipOption
                    active={shippingMethod === "expedited"}
                    onClick={() => setShippingMethod("expedited")}
                    icon={Zap}
                    name="USPS Expedited"
                    eta="2–4 business days"
                    price={fmtPrice(EXPEDITED_SHIPPING)}
                    note="Flat rate — pay for speed."
                  />
                </div>
              </div>

              {/* Charity donation */}
              <CharityDonation amountCents={donationCents} onChange={setDonationCents} />
            </div>

            <aside className="h-fit space-y-4">
              <div className="rounded-2xl border border-gold/40 bg-card p-5 shadow-[0_0_40px_-20px_rgba(212,175,76,0.4)]">
                <h2 className="font-display text-lg font-black uppercase tracking-wide">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k="Subtotal" v={fmtPrice(totals.subtotal)} />
                  {totals.bundleDiscount > 0 ? (
                    <Row k={`Bundle (${BUNDLE_DISCOUNT_PCT}% off ${BUNDLE_DISCOUNT_THRESHOLD}+ items)`} v={`− ${fmtPrice(totals.bundleDiscount)}`} highlight />
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Add {BUNDLE_DISCOUNT_THRESHOLD - totals.itemCount} more item{BUNDLE_DISCOUNT_THRESHOLD - totals.itemCount === 1 ? "" : "s"} for {BUNDLE_DISCOUNT_PCT}% off.</p>
                  )}
                  <Row
                    k={`Shipping · ${shippingMethod === "expedited" ? "Expedited" : "Standard"}${totals.freeShipping ? " (FREE)" : ""}`}
                    v={totals.shipping === 0 ? "FREE" : fmtPrice(totals.shipping)}
                    highlight={totals.freeShipping}
                  />
                  {donationCents > 0 && (
                    <Row k="Wounded Warrior donation" v={fmtPrice(donationCents)} highlight />
                  )}
                  <div className="border-t border-border pt-2">
                    <Row k="Total" v={fmtPrice(totals.grand)} bold />
                  </div>
                </dl>

                {err && <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{err}</p>}

                <div className="mt-4">
                  <VeteranBadge />
                </div>

                <Button className="mt-4 w-full font-bold" size="lg" onClick={startCheckout} disabled={busy}>
                  {busy ? "Opening checkout…" : "Checkout securely →"}
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Tax calculated at checkout. Customized items add ~1 week.</p>
              </div>
            </aside>
          </div>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}

function ShipOption({
  active, onClick, icon: Icon, name, eta, price, note,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Truck;
  name: string;
  eta: string;
  price: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition",
        active ? "border-gold bg-gold/10" : "border-border bg-card hover:border-gold/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-muted-foreground")} />
          <span className="font-display text-sm font-bold">{name}</span>
        </div>
        <span className="font-data text-sm font-bold text-gold">{price}</span>
      </div>
      <div className="mt-1 font-data text-[11px] uppercase tracking-wider text-muted-foreground">{eta}</div>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </button>
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
