import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { WhatsAppIcon } from "@/components/Icons";
import { formatINR, ORDER_STATUSES } from "@/lib/utils";
import { updateOrderStatus, sendFeedbackNow } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  await guardPage("orders");
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { email: true, name: true } } },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="font-display text-3xl">Order #{order.number}</h1>
          <div className="text-sm text-ink/50 mt-1">{new Date(order.createdAt).toLocaleString("en-IN")}</div>
        </div>
        <form action={updateOrderStatus} className="flex items-end gap-2">
          <input type="hidden" name="id" value={order.id} />
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={order.status} className="input !py-2">
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment</label>
            <select name="paymentStatus" defaultValue={order.paymentStatus} className="input !py-2">
              {["PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Courier</label>
            <input name="courier" defaultValue={order.courier ?? ""} placeholder="Shiprocket / Delhivery" className="input !py-2 w-40" />
          </div>
          <div>
            <label className="label">Tracking number (AWB)</label>
            <input name="awb" defaultValue={order.awb ?? ""} placeholder="AWB" className="input !py-2 w-40" />
          </div>
          <button className="btn-primary !py-2.5">Update</button>
        </form>
      </div>

      <div className="admin-card mb-6 text-sm grid sm:grid-cols-2 gap-3">
        <div><span className="text-ink/50">GST invoice</span><div className="font-medium">{order.invoiceNumber ?? "Issued when the order is paid"}</div></div>
        <div><span className="text-ink/50">WhatsApp updates</span><div className="font-medium">{order.whatsappOptIn ? "Opted in" : "Opted out"}</div></div>
        <div><span className="text-ink/50">Packed</span><div>{order.packedAt ? new Date(order.packedAt).toLocaleString("en-IN") : "Not yet"}</div></div>
        <div><span className="text-ink/50">Shipped</span><div>{order.shippedAt ? `${new Date(order.shippedAt).toLocaleString("en-IN")}${order.courier ? `, ${order.courier}` : ""}${order.awb ? `, AWB ${order.awb}` : ""}` : "Not yet"}</div></div>
        <div><span className="text-ink/50">Delivered</span><div>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString("en-IN") : "Not yet"}</div></div>
        <div><span className="text-ink/50">Loyalty</span><div>{order.pointsRedeemed ? `${order.pointsRedeemed} points used` : "No points used"}{order.pointsEarned ? `, ${order.pointsEarned} earned` : ""}{order.membershipDiscount ? `, Circle discount ${formatINR(order.membershipDiscount)}` : ""}</div></div>
        <form action={sendFeedbackNow} className="sm:col-span-2 flex items-center gap-3 border-t border-gold/20 pt-3">
          <input type="hidden" name="id" value={order.id} />
          <button className="btn-outline !py-2 !px-4 text-sm">Send feedback follow-up on WhatsApp now</button>
          <span className="text-xs text-ink/50">{order.feedbackSentAt ? `Last sent ${new Date(order.feedbackSentAt).toLocaleString("en-IN")}` : "Asks for a wearing photo and offers the coupon"}</span>
        </form>
      </div>

      {/* Downloads, invoice / packing slip and a spreadsheet row for this order */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/admin/orders/${order.id}/invoice`} className="btn-primary !py-2 !px-4 text-sm">
          Invoice / packing slip
        </Link>
        <a
          href={`/api/admin/orders/export?id=${order.id}`}
          className="btn-outline !py-2 !px-4 text-sm"
          download
        >
          Download as CSV
        </a>
        <a
          href={`https://wa.me/${order.phone.replace(/[^\d]/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(
            `Hi ${order.name.split(" ")[0]}, this is Rudrika by Tara about your order #${order.number}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn !py-2 !px-4 text-sm bg-[#25D366] text-white hover:bg-[#1da851] inline-flex items-center gap-1.5"
        >
          <WhatsAppIcon className="w-4 h-4" /> Message customer
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8 text-sm">
        <div className="admin-card">
          <div className="label">Customer</div>
          {order.name}<br />{order.email}<br />{order.phone}
          {order.user && <div className="text-xs text-ink/40 mt-1">Registered account</div>}
        </div>
        <div className="admin-card">
          <div className="label">Ship to</div>
          {order.addressLine}<br />{order.city}, {order.state}, {order.pincode}
        </div>
      </div>

      <div className="admin-card !p-0 divide-y divide-ink/10 mb-6">
        {order.items.map((i) => (
          <div key={i.id} className="flex gap-4 items-center p-4">
            <div className="relative w-12 aspect-[4/5] bg-sand shrink-0">
              {i.image && <Image src={i.image} alt={i.name} fill className="object-contain" />}
            </div>
            <div className="flex-1 text-sm">
              <div className="font-medium">{i.name}</div>
              <div className="text-ink/50 text-xs">{i.variantLabel}, Qty {i.qty}</div>
              {(i as any).fit && (
                <div className="text-xs text-clay mt-0.5">Customer: {(i as any).fit}</div>
              )}
            </div>
            <div className="text-sm">{formatINR(i.price * i.qty)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 text-sm ml-auto max-w-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>−{formatINR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
        <div className="flex justify-between font-medium text-base border-t border-ink/10 pt-2">
          <span>Total</span><span>{formatINR(order.total)}</span>
        </div>
        <div className="text-xs text-ink/40 pt-2">
          {order.paymentMethod}
          {order.razorpayPaymentId && <>, {order.razorpayPaymentId}</>}
        </div>
      </div>
    </div>
  );
}
