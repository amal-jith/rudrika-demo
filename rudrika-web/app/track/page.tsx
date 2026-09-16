import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/utils";
import { STORE } from "@/lib/store-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track your order" };

const LABEL: Record<string, string> = { PENDING: "Order placed", PLACED: "Confirmed", PACKED: "Packed", SHIPPED: "Shipped", DELIVERED: "Delivered" };

export default async function TrackPage({ searchParams }: { searchParams: { number?: string; phone?: string } }) {
  const number = parseInt((searchParams.number || "").replace(/\D/g, ""), 10);
  const phone = (searchParams.phone || "").replace(/\D/g, "").slice(-10);
  const order = number && phone.length === 10
    ? await db.order.findFirst({ where: { number }, select: { number: true, status: true, phone: true, courier: true, awb: true, createdAt: true, packedAt: true, shippedAt: true, deliveredAt: true, items: { select: { name: true, qty: true, preorder: true } } } })
    : null;
  const match = order && order.phone.replace(/\D/g, "").slice(-10) === phone ? order : null;
  const steps = ORDER_STATUSES.filter((s) => s !== "CANCELLED");
  const idx = match ? steps.indexOf(match.status as any) : -1;
  const when = (s: string) => !match ? "" : s === "PENDING" ? match.createdAt : s === "PACKED" ? match.packedAt : s === "SHIPPED" ? match.shippedAt : s === "DELIVERED" ? match.deliveredAt : null;
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">Order tracking</div>
      <h1 className="font-display text-3xl sm:text-5xl mb-3">Where is my saree?</h1>
      <p className="text-ink/60 mb-6">Enter your order number and the phone number used on the order. Courier tracking is also available on <a className="underline" href={STORE.shipping.tracking} target="_blank" rel="noopener">Shiprocket</a>.</p>
      <form className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mb-8">
        <input name="number" required defaultValue={searchParams.number ?? ""} placeholder="Order number, for example 1001" className="input" />
        <input name="phone" required defaultValue={searchParams.phone ?? ""} placeholder="Phone number" className="input" />
        <button className="btn-primary">Track</button>
      </form>
      {searchParams.number && !match && <div className="bg-sand p-4 text-sm">No order found for that number and phone. Check both and try again, or write to us on WhatsApp.</div>}
      {match && (
        <div className="bg-white border border-gold/30 p-6">
          <div className="flex items-baseline justify-between mb-4"><h2 className="font-display text-2xl">Order #{match.number}</h2><span className="text-sm">{match.status === "CANCELLED" ? "Cancelled" : LABEL[match.status] ?? match.status}</span></div>
          {match.status === "CANCELLED" ? <p className="text-sm text-red-700">This order was cancelled and refunded to the original payment method.</p> : (
            <ol className="space-y-3">
              {steps.map((s, i) => { const d = when(s); return (
                <li key={s} className={`flex gap-3 text-sm ${i <= idx ? "text-ink" : "text-ink/40"}`}>
                  <span className={`mt-1 w-3 h-3 rounded-full border ${i < idx ? "bg-clay border-clay" : i === idx ? "bg-gold border-gold" : "border-ink/30"}`} />
                  <span>{LABEL[s]}{s === "SHIPPED" && match.courier ? `, ${match.courier}` : ""}{s === "SHIPPED" && match.awb ? `, tracking number ${match.awb}` : ""}{d ? <span className="block text-xs text-ink/50">{new Date(d).toLocaleString("en-IN")}</span> : null}</span>
                </li>); })}
            </ol>
          )}
          <div className="text-xs text-ink/50 mt-4">{match.items.map((i) => `${i.name} x${i.qty}${i.preorder ? " (pre-order, ships in 5 to 10 working days)" : ""}`).join(", ")}</div>
          <div className="mt-5 flex gap-3"><a className="btn-outline !py-2 !px-4 text-sm" href={STORE.shipping.tracking} target="_blank" rel="noopener">Courier tracking</a><Link className="btn-outline !py-2 !px-4 text-sm" href="/account/orders">My orders</Link></div>
        </div>
      )}
    </div>
  );
}
