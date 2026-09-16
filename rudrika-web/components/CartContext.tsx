"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  image: string;
  price: number; // paise
  qty: number;
  maxStock: number;
  /** Customer's own measurements, typed on the product page. Optional. */
  fitBust?: string;
  fitHeight?: string;
};

type Ctx = {
  items: CartItem[];
  /** Add to the cart, increasing the quantity if the size is already in there. */
  add: (item: CartItem) => void;
  /**
   * Put the item in the cart at exactly this quantity, replacing any existing
   * line for the same size rather than adding to it. Used by "Buy Now" so that
   * pressing Add to Cart and then Buy Now doesn't order the piece twice.
   */
  put: (item: CartItem) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qpm_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("qpm_cart", JSON.stringify(items));
  }, [items, loaded]);

  const add = (item: CartItem) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.variantId === item.variantId);
      if (ex) {
        // Quantities add up, but the measurements just typed replace whatever
        // was entered earlier, the latest ones are what the customer means.
        return prev.map((i) =>
          i.variantId === item.variantId
            ? {
                ...i,
                fitBust: item.fitBust || i.fitBust,
                fitHeight: item.fitHeight || i.fitHeight,
                qty: Math.min(i.qty + item.qty, i.maxStock),
              }
            : i
        );
      }
      return [...prev, item];
    });

  const put = (item: CartItem) =>
    setItems((prev) => {
      const qty = Math.max(1, Math.min(item.qty, item.maxStock));
      const ex = prev.find((i) => i.variantId === item.variantId);
      if (ex) return prev.map((i) => (i.variantId === item.variantId ? { ...i, ...item, qty } : i));
      return [...prev, { ...item, qty }];
    });

  const remove = (variantId: string) =>
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));

  const setQty = (variantId: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i
      )
    );

  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, put, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart outside provider");
  return ctx;
}
