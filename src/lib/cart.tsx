import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PRODUCTS,
  productBySlug,
  CUSTOMIZATION_FEE,
  BUNDLE_DISCOUNT_PCT,
  BUNDLE_DISCOUNT_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
  EXPEDITED_SHIPPING,
  applyOversize,
} from "@/lib/merch/catalog";

export interface CartLine {
  id: string;            // synthetic id (slug + variants)
  slug: string;
  qty: number;
  size?: string;
  fit?: string;
  color?: string;
  customText?: string;   // user-supplied
}

export type ShippingMethod = "standard" | "expedited";

const KEY = "pp_cart_v1";

interface Ctx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "id" | "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  // Shipping method selection (persists per session).
  shippingMethod: ShippingMethod;
  setShippingMethod: (m: ShippingMethod) => void;
  // Optional Wounded Warrior Project donation in cents — passthrough add-on.
  donationCents: number;
  setDonationCents: (c: number) => void;
  totals: {
    itemCount: number;
    subtotal: number;       // after per-line customization + oversize, before bundle discount
    bundleDiscount: number; // cents off
    afterDiscount: number;
    shipping: number;       // 0 when Standard is free
    freeShipping: boolean;  // only true for Standard at/above threshold
    grand: number;          // includes shipping + donation
  };
}

const CartCtx = createContext<Ctx | null>(null);

function makeId(line: Omit<CartLine, "id" | "qty">): string {
  return [line.slug, line.size ?? "", line.fit ?? "", line.color ?? "", line.customText ?? ""].join("|");
}

/** Per-line unit price (cents): base + customization + oversize upcharge. */
export function lineUnitPrice(line: { slug: string; size?: string; customText?: string }): number {
  const p = productBySlug(line.slug);
  if (!p) return 0;
  const base = p.price + (line.customText ? CUSTOMIZATION_FEE : 0);
  return applyOversize(base, line.size);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [donationCents, setDonationCents] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* noop */ }
  }, [lines]);

  const add: Ctx["add"] = useCallback((payload) => {
    const qty = payload.qty ?? 1;
    const id = makeId(payload);
    setLines((prev) => {
      const exists = prev.find((l) => l.id === id);
      if (exists) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { ...payload, id, qty }];
    });
  }, []);

  const setQty: Ctx["setQty"] = useCallback((id, qty) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
  }, []);

  const remove: Ctx["remove"] = useCallback((id) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear: Ctx["clear"] = useCallback(() => {
    setLines([]);
    setDonationCents(0);
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let itemCount = 0;
    for (const l of lines) {
      const unit = lineUnitPrice(l);
      subtotal += unit * l.qty;
      itemCount += l.qty;
    }
    const bundleDiscount = itemCount >= BUNDLE_DISCOUNT_THRESHOLD ? Math.round((subtotal * BUNDLE_DISCOUNT_PCT) / 100) : 0;
    const afterDiscount = subtotal - bundleDiscount;

    // Free shipping only applies to Standard at/above threshold.
    // Expedited is always charged — the user is paying for speed.
    const standardFree = afterDiscount >= FREE_SHIPPING_THRESHOLD;
    let shipping = 0;
    let freeShipping = false;
    if (lines.length > 0) {
      if (shippingMethod === "expedited") {
        shipping = EXPEDITED_SHIPPING;
      } else if (standardFree) {
        shipping = 0;
        freeShipping = true;
      } else {
        shipping = STANDARD_SHIPPING;
      }
    }

    const grand = afterDiscount + shipping + donationCents;
    return { itemCount, subtotal, bundleDiscount, afterDiscount, shipping, freeShipping, grand };
  }, [lines, shippingMethod, donationCents]);

  const value: Ctx = {
    lines, add, setQty, remove, clear,
    shippingMethod, setShippingMethod,
    donationCents, setDonationCents,
    totals,
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Re-export so consumers can build a UI without a second import.
export { PRODUCTS };
