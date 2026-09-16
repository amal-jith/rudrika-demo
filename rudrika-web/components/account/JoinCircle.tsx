"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

declare global { interface Window { Razorpay?: any } }

/** Buys a one-year Rudrika Circle membership. Mock mode completes instantly. */
export default function JoinCircle({ label, priceLabel, renew }: { label: string; priceLabel: string; renew: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/membership", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not start membership");
      if (d.mock) { setMsg(`Welcome to ${label}. Order #${d.orderNumber} is in your orders with a GST invoice.`); router.refresh(); return; }
      await new Promise<void>((res, rej) => {
        if (window.Razorpay) return res();
        const sc = document.createElement("script"); sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.onload = () => res(); sc.onerror = () => rej(new Error("Payment script failed to load")); document.body.appendChild(sc);
      });
      const rz = new window.Razorpay({
        key: d.keyId, amount: d.amount, currency: "INR", name: "Rudrika by Tara", description: `${label} membership, one year`, order_id: d.razorpayOrderId,
        handler: async (resp: any) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: d.orderId, ...resp }) });
          if (v.ok) { setMsg(`Welcome to ${label}.`); router.refresh(); } else setMsg("Payment could not be verified. Please contact us on WhatsApp.");
        },
        theme: { color: "#471113" },
      });
      rz.open();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  return (
    <div>
      <button onClick={join} disabled={busy} className="btn-primary">{busy ? "Please wait" : `${renew ? "Renew" : "Join"} ${label} for ${priceLabel} a year`}</button>
      {msg && <p className="text-sm mt-3 text-clay">{msg}</p>}
    </div>
  );
}
