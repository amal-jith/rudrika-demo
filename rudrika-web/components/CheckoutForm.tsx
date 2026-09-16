"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { formatINR, FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "@/lib/utils";
import type { Zone } from "@/lib/shipping";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Mirrors lib/shipping.ts so the total updates live as the customer types. */
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function shippingFrom(zones: Zone[], subtotal: number, state: string): number {
  if (zones.length === 0) return subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FLAT;
  const wanted = norm(state);
  const zone =
    (wanted && zones.find((z) => z.states.some((s) => norm(s) === wanted))) ||
    zones.find((z) => z.isDefault) ||
    zones[0];
  if (!zone) return SHIPPING_FLAT;
  if (zone.freeAbove != null && subtotal >= zone.freeAbove) return 0;
  return zone.rate;
}

export default function CheckoutForm({
  user,
  zones = [],
}: {
  user: { name: string; email: string; phone: string } | null;
  zones?: Zone[];
}) {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [coupon, setCoupon] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [points, setPoints] = useState(0);
  const [loyalty, setLoyalty] = useState<{ balance: number; max: number; pointValue: number; member: boolean; discountPercent: number } | null>(null);
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/loyalty/me?subtotal=${subtotal}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setLoyalty(d)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);
  const [error, setError] = useState("");

  // Recalculated as the delivery state changes; the server recomputes it
  // independently at checkout, so this is display only.
  const shipping = shippingFrom(zones, subtotal, form.state);
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const applyCoupon = async () => {
    setCouponMsg("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, subtotal }),
    });
    const data = await res.json();
    if (res.ok) {
      setApplied({ code: data.code, discount: data.discount });
      setCouponMsg(`Applied! You save ${formatINR(data.discount)}`);
    } else {
      setApplied(null);
      setCouponMsg(data.error ?? "Invalid coupon");
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            qty: i.qty,
            fitBust: i.fitBust,
            fitHeight: i.fitHeight,
          })),
          couponCode: applied?.code,
          whatsappOptIn: optIn,
          points,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      if (data.mock) {
        clear();
        router.push(`/orders/${data.orderId}?placed=1`);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay. Check your connection.");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Rudrika by Tara",
        description: `Order #${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#9a3f2c" },
        handler: async (resp: any) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          if (v.ok) {
            clear();
            router.push(`/orders/${data.orderId}?placed=1`);
          } else {
            setError("Payment verification failed. Contact support with order #" + data.orderNumber);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="text-center py-16">
        <p className="text-ink/50 mb-6">Your cart is empty.</p>
        <Link href="/products" className="btn-primary">Shop Now</Link>
      </div>
    );

  return (
    <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-6 lg:gap-10">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h2 className="font-display text-2xl mb-4">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full name</label><input required className="input" value={form.name} onChange={set("name")} /></div>
            <div><label className="label">Email</label><input required type="email" className="input" value={form.email} onChange={set("email")} /></div>
            <div><label className="label">Phone</label><input required className="input" value={form.phone} onChange={set("phone")} pattern="[0-9+ -]{10,}" /></div>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-4">Shipping Address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">Address</label><input required className="input" value={form.addressLine} onChange={set("addressLine")} /></div>
            <div><label className="label">City</label><input required className="input" value={form.city} onChange={set("city")} /></div>
            <div><label className="label">State</label><input required className="input" value={form.state} onChange={set("state")} /></div>
            <div><label className="label">PIN code</label><input required className="input" value={form.pincode} onChange={set("pincode")} pattern="[0-9]{6}" /></div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} /> Send order updates on WhatsApp</label>
            {loyalty && loyalty.member && (
              <p className="sm:col-span-2 text-sm text-clay">Rudrika Circle member: {loyalty.discountPercent}% off and free shipping are applied automatically.</p>
            )}
            {loyalty && loyalty.balance > 0 && (
              <div className="sm:col-span-2">
                <label className="label">Use loyalty points (you have {loyalty.balance}, up to {loyalty.max} on this order, 1 point = Rs. {(loyalty.pointValue / 100).toFixed(0)})</label>
                <input type="number" min={0} max={loyalty.max} className="input" value={points} onChange={(e) => setPoints(Math.max(0, Math.min(loyalty.max, Math.round(Number(e.target.value) || 0))))} />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="admin-card h-fit">
        <div className="font-display text-xl mb-4">Order Summary</div>
        <div className="space-y-3 mb-4 max-h-56 overflow-auto pr-1">
          {items.map((i) => (
            <div key={i.variantId} className="flex justify-between text-sm gap-2">
              <span className="text-ink/70">{i.name} ({i.variantLabel}) x {i.qty}</span>
              <span>{formatINR(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input className="input" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
          <button type="button" onClick={applyCoupon} className="btn-outline shrink-0 !px-4">Apply</button>
        </div>
        {couponMsg && <div className={`text-xs mb-3 ${applied ? "text-green-700" : "text-clay"}`}>{couponMsg}</div>}
        <div className="space-y-2 text-sm border-t border-ink/10 pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount ({applied!.code})</span><span>−{formatINR(discount)}</span></div>}
          <div className="flex justify-between">
            <span>Shipping{form.state ? "" : " (enter state)"}</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="flex justify-between font-medium text-base border-t border-ink/10 pt-2">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
        </div>
        {error && <p className="text-sm text-clay mt-3">{error}</p>}
        <button className="btn-primary w-full mt-5" disabled={busy}>
          {busy ? "Processing" : `Pay ${formatINR(total)}`}
        </button>
        <p className="text-[11px] text-ink/40 mt-3 text-center">Secure payment via Razorpay, UPI, Cards, NetBanking</p>
      </div>
    </form>
  );
}
