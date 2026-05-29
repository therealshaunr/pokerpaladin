import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "./index";
import { CartProvider, useCart, fmtPrice } from "@/lib/cart";
import { PRODUCTS } from "@/lib/merch/catalog";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Merch Shop — Poker Paladin" },
      { name: "description", content: "Holy-forged Poker Paladin gear: tees, hoodies, shades, socks, bottles, stickers. Bundle 3 for 10% off, free shipping over $100." },
      { property: "og:title", content: "Poker Paladin Merch" },
      { property: "og:description", content: "Wear the crest. Bundle 3 for 10% off." },
    ],
  }),
  component: () => (
    <CartProvider>
      <ShopPage />
    </CartProvider>
  ),
});

function ShopPage() {
  const { totals } = useCart();
  const grouped = {
    apparel: PRODUCTS.filter((p) => p.category === "apparel"),
    accessory: PRODUCTS.filter((p) => p.category === "accessory"),
    stationery: PRODUCTS.filter((p) => p.category === "stationery"),
    bundle: PRODUCTS.filter((p) => p.category === "bundle"),
  };

  return (
    <main className="matrix-bg min-h-dvh">
      <SiteNav />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <header className="py-10 text-center">
          <p className="font-data text-xs uppercase tracking-[0.4em] text-gold">The Paladin Armory</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-6xl">Wear the <span className="text-gold">crest</span>.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">Bundle <span className="text-gold font-semibold">3+ items</span> for 10% off · free shipping over <span className="text-gold font-semibold">$100</span> · custom names on most apparel (+$8, +1 week).</p>
          <Link to="/shop/cart" className="mt-5 inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 font-data text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/20">
            <ShoppingBag className="h-4 w-4" /> Cart · {totals.itemCount} · {fmtPrice(totals.grand)}
          </Link>
        </header>

        <Section title="Bundles · Best Value" items={grouped.bundle} />
        <Section title="Apparel" items={grouped.apparel} />
        <Section title="Accessories" items={grouped.accessory} />
        <Section title="Stationery & Stickers" items={grouped.stationery} />

        <SiteFooter />
      </div>
    </main>
  );
}

function Section({ title, items }: { title: string; items: typeof PRODUCTS }) {
  if (!items.length) return null;
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-2xl font-black uppercase tracking-wide">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.slug}
            to="/shop/$slug"
            params={{ slug: p.slug }}
            className="group relative rounded-2xl border border-border bg-card p-5 transition hover:border-gold hover:shadow-[0_0_30px_-10px_rgba(212,175,76,0.4)]"
          >
            {p.badge && (
              <span className="absolute right-3 top-3 rounded-md border border-gold/50 bg-gold/10 px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-wider text-gold">{p.badge}</span>
            )}
            <div className="aspect-square rounded-xl border border-border bg-secondary/30 p-4 group-hover:border-gold/40 transition">
              <CrestArt slug={p.slug} />
            </div>
            <div className="mt-4 flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <span className="font-data text-sm font-bold text-gold">{fmtPrice(p.price)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Lightweight SVG "product art" so the shop isn't a wall of grey rectangles.
function CrestArt({ slug }: { slug: string }) {
  const accent = slug.includes("hoodie") ? "#7c5cff" : slug.includes("cap") || slug.includes("shades") ? "#d4af4c" : slug.includes("bundle") || slug.includes("kit") ? "#22d3a8" : slug.includes("stickers") ? "#ec4899" : "#d4af4c";
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id={`g-${slug}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#g-${slug})`} />
      <g stroke={accent} strokeWidth="1.5" fill="none" opacity="0.9">
        <path d="M50 18 L62 28 L62 50 Q62 68 50 80 Q38 68 38 50 L38 28 Z" />
        <circle cx="50" cy="44" r="6" />
        <path d="M44 56 L56 56 M47 62 L53 62" strokeLinecap="round" />
      </g>
      <text x="50" y="92" textAnchor="middle" fill={accent} fontFamily="monospace" fontSize="6" letterSpacing="2">PALADIN</text>
    </svg>
  );
}
