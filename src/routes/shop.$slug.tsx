import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "./index";
import { CartProvider, useCart, fmtPrice, lineUnitPrice } from "@/lib/cart";
import { productBySlug, CUSTOMIZATION_FEE, CUSTOMIZATION_DAYS, isOversize, OVERSIZE_UPCHARGE_PCT } from "@/lib/merch/catalog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Check } from "lucide-react";
import { VeteranBadge } from "@/components/VeteranBadge";
import { SizeSubscribePrompt } from "@/components/SizeSubscribePrompt";

export const Route = createFileRoute("/shop/$slug")({
  component: () => (
    <CartProvider>
      <ProductPage />
    </CartProvider>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = productBySlug(slug);
  const navigate = useNavigate();
  const { add, totals } = useCart();
  const [size, setSize] = useState<string | undefined>(product?.sizes?.[0]?.id);
  const [fit, setFit] = useState<string | undefined>(product?.fits?.[0]?.id);
  const [color, setColor] = useState<string | undefined>(product?.colors?.[0]?.id);
  const [customText, setCustomText] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="matrix-bg min-h-dvh">
        <SiteNav />
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-black">Item not found</h1>
          <Link to="/shop" className="mt-4 inline-block text-sm text-gold underline">Back to shop</Link>
        </div>
      </main>
    );
  }

  const customCost = customText.trim() ? CUSTOMIZATION_FEE : 0;
  const unit = lineUnitPrice({ slug: product.slug, size, customText: customText.trim() || undefined });
  const upcharged = isOversize(size);

  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const apparel = product.category === "apparel";

  const onAdd = () => {
    add({ slug: product.slug, size, fit, color, customText: customText.trim() || undefined, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    if (apparel) setSubscribeOpen(true);
  };

  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16">
        <div className="flex items-center justify-between py-4">
          <Link to="/shop" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All merch
          </Link>
          <Link to="/shop/cart" className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 font-data text-[11px] font-bold uppercase tracking-wider text-gold hover:bg-gold/20">
            <ShoppingBag className="h-3.5 w-3.5" /> {totals.itemCount} · {fmtPrice(totals.grand)}
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-2xl border border-border bg-card p-8 shadow-[0_0_60px_-20px_rgba(212,175,76,0.3)]">
            <CrestBig accent={color === "matrix" ? "#22d3a8" : color === "wizard" ? "#7c5cff" : color === "obsidian" ? "#888" : "#d4af4c"} />
          </div>

          <div>
            <h1 className="font-display text-3xl font-black md:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{product.blurb}</p>
            <div className="mt-4 font-display text-3xl font-black text-gold">{fmtPrice(unit)}</div>

            {product.bundleOf && (
              <div className="mt-4 rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">
                Includes: {product.bundleOf.join(" · ")}
              </div>
            )}

            {product.fits && (
              <OptionRow label="Fit" options={product.fits} value={fit} onChange={setFit} />
            )}
            {product.colors && (
              <OptionRow label="Color" options={product.colors} value={color} onChange={setColor} />
            )}
            {product.sizes && (
              <OptionRow label="Size" options={product.sizes} value={size} onChange={setSize} />
            )}

            {product.customizable && (
              <div className="mt-5">
                <label className="font-data text-[11px] uppercase tracking-wider text-muted-foreground">Add a custom name (above the crest)</label>
                <input
                  type="text"
                  maxLength={20}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. SIR SHAUN"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-data text-sm uppercase tracking-wider"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {customText.trim() ? (
                    <>+ <span className="text-gold">{fmtPrice(CUSTOMIZATION_FEE)}</span> · adds {CUSTOMIZATION_DAYS} days to delivery.</>
                  ) : (
                    <>Optional. +{fmtPrice(CUSTOMIZATION_FEE)} and +{CUSTOMIZATION_DAYS} days when added.</>
                  )}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center rounded-md border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 text-lg font-bold">−</button>
                <span className="w-10 text-center font-data">{qty}</span>
                <button onClick={() => setQty(Math.min(20, qty + 1))} className="h-10 w-10 text-lg font-bold">+</button>
              </div>
              <Button size="lg" className="flex-1 font-bold" onClick={onAdd}>
                {added ? <><Check className="h-4 w-4" /> Added</> : <>Add to cart · {fmtPrice(unit * qty)}</>}
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => { onAdd(); setTimeout(() => navigate({ to: "/shop/cart" }), 200); }}>
              Buy now →
            </Button>

            <p className="mt-5 text-[11px] text-muted-foreground">
              Bundle 3+ items for <span className="text-gold font-semibold">10% off</span> · free shipping over <span className="text-gold font-semibold">$100</span>.
            </p>
          </div>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

function OptionRow({ label, options, value, onChange }: { label: string; options: { id: string; label: string }[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-5">
      <div className="font-data text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`rounded-md border px-3 py-1.5 font-data text-xs uppercase tracking-wider transition ${active ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-foreground hover:border-gold/40"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CrestBig({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id="cb-g" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cb-g)" />
      <g stroke={accent} strokeWidth="1.2" fill="none">
        <path d="M50 14 L66 26 L66 52 Q66 72 50 86 Q34 72 34 52 L34 26 Z" />
        <circle cx="50" cy="44" r="7" />
        <path d="M43 58 L57 58 M46 64 L54 64" strokeLinecap="round" />
      </g>
      <text x="50" y="96" textAnchor="middle" fill={accent} fontFamily="monospace" fontSize="5" letterSpacing="3">PALADIN</text>
    </svg>
  );
}
