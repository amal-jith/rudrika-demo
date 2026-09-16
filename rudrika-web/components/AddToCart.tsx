"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./CartContext";
import { formatINR } from "@/lib/utils";

type Variant = { id: string; label: string; stock: number; price: number | null };

export default function AddToCart({
  product,
  variants,
}: {
  product: { id: string; slug: string; name: string; price: number; image: string };
  variants: Variant[];
}) {
  const { add, put } = useCart();
  const router = useRouter();
  const inStock = variants.filter((v) => v.stock > 0);
  const [selected, setSelected] = useState<Variant | null>(inStock.length === 1 ? inStock[0] : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = selected?.price ?? product.price;

  const line = (): CartItem | null =>
    selected && {
      productId: product.id,
      variantId: selected.id,
      slug: product.slug,
      name: product.name,
      variantLabel: selected.label,
      image: product.image,
      price: selected.price ?? product.price,
      qty,
      maxStock: selected.stock,
    };

  const doAdd = () => {
    const item = line();
    if (!item) return;
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Buy Now uses `put`, not `add`. If the customer already pressed Add to Cart,
  // this replaces that line instead of stacking a second one on top of it -
  // so the cart total stays correct either way round.
  const buyNow = () => {
    const item = line();
    if (!item) {
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    put(item);
    router.push("/checkout");
  };

  if (variants.length === 0 || inStock.length === 0) {
    return <div className="text-clay font-medium">Out of stock</div>;
  }

  return (
    <div id="size-picker">
      <div className="label">Select option</div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            disabled={v.stock === 0}
            onClick={() => { setSelected(v); setQty(1); }}
            className={`px-4 py-2 border text-sm ${
              selected?.id === v.id
                ? "bg-ink text-cream border-ink"
                : v.stock === 0
                ? "border-ink/10 text-ink/30 line-through cursor-not-allowed"
                : "border-ink/30 hover:border-ink"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Quantity + the two actions.
          Fixed layout: the buttons keep the same position whether or not a size
          is chosen, so nothing jumps around as the customer taps through. */}
      <div className="flex items-center gap-3 sm:gap-4 mt-6">
        <div className="flex items-center border border-ink/30 shrink-0">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="px-3 py-2.5 hover:bg-sand"
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            −
          </button>
          <span className="px-4 text-sm tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="px-3 py-2.5 hover:bg-sand"
            onClick={() => setQty(Math.min(selected?.stock ?? 99, qty + 1))}
          >
            +
          </button>
        </div>
        <button onClick={doAdd} disabled={!selected} className="btn-primary flex-1 min-w-0 truncate">
          {added ? "Added" : selected ? `Add to cart, ${formatINR(price * qty)}` : "Select an option"}
        </button>
      </div>

      {/* Desktop / tablet Buy Now. On phones this is hidden because the sticky
          bar at the bottom of the screen already carries the same action -
          showing both was what made the button appear to move around. */}
      {/* Desktop only, see the note in BuyBox: `hidden` has to sit on a wrapper
          because `.btn` overrides it on the element itself. */}
      <div className="hidden sm:block">
        <button onClick={buyNow} disabled={!selected} className="btn-outline w-full mt-3">
          Buy Now
        </button>
      </div>

      {/* Sticky mobile buy bar (sits above the bottom nav) */}
      <div className="sm:hidden fixed bottom-16 inset-x-0 z-40 bg-white border-t border-gold/25 shadow-[0_-4px_16px_rgba(43,29,18,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="shrink-0 leading-tight">
          <div className="font-display text-lg">{formatINR(price * qty)}</div>
          <div className="text-[10px] text-ink/50 uppercase tracking-wider">
            {selected ? `Size ${selected.label}` : "Select a size"}
          </div>
        </div>
        <button onClick={buyNow} className="btn-primary flex-1 !py-3 !px-4 text-sm">
          {selected ? "Buy Now" : "Choose Size"}
        </button>
      </div>
    </div>
  );
}
