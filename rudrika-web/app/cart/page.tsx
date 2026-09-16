"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartContext";
import { formatINR, shippingFor, FREE_SHIPPING_ABOVE } from "@/lib/utils";

export default function CartPage() {
  const { items, remove, setQty, subtotal } = useCart();
  const shipping = shippingFor(subtotal);

  if (items.length === 0)
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl mb-4">Your cart is empty</h1>
        <p className="text-ink/50 mb-8">Beautiful things await.</p>
        <Link href="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-4xl mb-6 sm:mb-10">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-2 space-y-6">
          {items.map((i) => (
            <div key={i.variantId} className="flex gap-4 border-b border-ink/10 pb-6">
              <Link href={`/products/${i.slug}`} className="relative w-24 h-30 aspect-[4/5] bg-sand shrink-0">
                {i.image && <Image src={i.image} alt={i.name} fill className="object-contain" />}
              </Link>
              <div className="flex-1">
                <Link href={`/products/${i.slug}`} className="font-display text-lg hover:text-clay">
                  {i.name}
                </Link>
                <div className="text-xs text-ink/50 mt-0.5">{i.variantLabel}</div>
                {(i.fitBust || i.fitHeight) && (
                  <div className="text-xs text-clay mt-0.5">
                    {[i.fitBust && `Bust ${i.fitBust}`, i.fitHeight && `Height ${i.fitHeight}`]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
                <div className="text-sm mt-1">{formatINR(i.price)}</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-ink/20 text-sm">
                    <button className="px-2.5 py-1.5 hover:bg-sand" onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                    <span className="px-3">{i.qty}</span>
                    <button className="px-2.5 py-1.5 hover:bg-sand" onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                  </div>
                  <button onClick={() => remove(i.variantId)} className="text-xs text-ink/40 hover:text-clay underline">
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-sm font-medium">{formatINR(i.price * i.qty)}</div>
            </div>
          ))}
        </div>

        <div className="admin-card h-fit">
          <div className="font-display text-xl mb-4">Summary</div>
          {shipping > 0 && (
            <div className="mb-4">
              <div className="text-xs text-clay mb-1.5">
                Add {formatINR(Math.max(0, FREE_SHIPPING_ABOVE - subtotal))} more for FREE shipping
              </div>
              <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 font-medium text-base">
              <span>Total</span><span>{formatINR(subtotal + shipping)}</span>
            </div>
          </div>
          <p className="text-xs text-ink/40 mt-3">Coupons can be applied at checkout.</p>
          <Link href="/checkout" className="btn-primary w-full mt-5">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}
