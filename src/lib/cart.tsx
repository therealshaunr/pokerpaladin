import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PRODUCTS,
  productBySlug,
  CUSTOMIZATION_FEE,
  BUNDLE_DISCOUNT_PCT,
  BUNDLE_DISCOUNT_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
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

const KEY = "pp_cart_v1";

interface Ctx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "id" | "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  totals: {
    itemCount: number;
    subtotal: number;       // after per-line customization, before bundle discount
    bundleDiscount: number; // cents off
    afterDiscount: number;
    shipping: number;       // 0 when free
    freeShipping: boolean;
    grand: number;
  };
}

const CartCtx = createContext<Ctx | null>(null);

function makeId(line: Omit<CartLine, "id" | "qty">): string {
  return [line.slug, line.size ?? "", line.fit ?? "", line.color ?? "", line.customText ?? ""].join("|");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

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
  const clear: Ctx["clear"] = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let itemCount = 0;
    for (const l of lines) {
      const p = productBySlug(l.slug);
      if (!p) continue;
      const unit = p.price + (l.customText ? CUSTOMIZATION_FEE : 0);
      subtotal += unit * l.qty;
      itemCount += l.qty;
    }
    const bundleDiscount = itemCount >= BUNDLE_DISCOUNT_THRESHOLD ? Math.round((subtotal * BUNDLE_DISCOUNT_PCT) / 100) : 0;
    const afterDiscount = subtotal - bundleDiscount;
    const freeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shipping = lines.length === 0 || freeShipping ? 0 : STANDARD_SHIPPING;
    return { itemCount, subtotal, bundleDiscount, afterDiscount, shipping, freeShipping, grand: afterDiscount + shipping };
  }, [lines]);

  const value: Ctx = { lines, add, setQty, remove, clear, totals };
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
