import Link from "next/link";
import { CheckIcon } from "@/components/Icons";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR, ORDER_STATUSES } from "@/lib/utils";
import OrderCelebration from "@/components/OrderCelebration";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { placed?: string };
}) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) notFound();

  // Guests can view via direct link right after purchase; logged-in users must own it
  const user = await getUser();
  if (order.userId && (!user || (user.id !== order.userId && user.role !== "ADMIN"))) notFound();

  const steps = ORDER_STATUSES.filter((s) => s !== "CANCELLED");
  const idx = steps.indexOf(order.status as any);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {searchParams.placed && <OrderCelebration orderNumber={order.number} />}

      <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl">Order #{order.number}</h1>
          <div className="text-sm text-ink/50 mt-1">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className={`inline-block px-3 py-1 ${order.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-sand"}`}>
            {order.status}
          </div>
          <div className="text-ink/50 mt-1">Payment: {order.paymentStatus}</div>
        </div>
      </div>

      {order.status !== "CANCELLED" && (
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    i <= idx ? "bg-clay text-cream" : "bg-sand text-ink/40"
                  }`}
                >
                  {i < idx ? <CheckIcon className="w-3 h-3" /> : i + 1}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1 text-ink/50">{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${i < idx ? "bg-clay" : "bg-ink/15"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 border-t border-ink/10 pt-6">
        {order.items.map((i) => (
          <div key={i.id} className="flex gap-4 items-center">
            <div className="relative w-16 aspect-[4/5] bg-sand shrink-0">
              {i.image && <Image src={i.image} alt={i.name} fill className="object-contain" />}
            </div>
            <div className="flex-1 text-sm">
              <div className="font-medium">{i.name}</div>
              <div className="text-ink/50 text-xs">{i.variantLabel}, Qty {i.qty}</div>
              {(i as any).fit && (
                <div className="text-xs text-clay mt-0.5">Your measurements: {(i as any).fit}</div>
              )}
            </div>
            <div className="text-sm">{formatINR(i.price * i.qty)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-ink/10 pt-4 space-y-1.5 text-sm ml-auto max-w-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
            <span>−{formatINR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
        <div className="flex justify-between font-medium text-base border-t border-ink/10 pt-2">
          <span>Total</span><span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 text-sm text-ink/60">
        <div className="label">Shipping to</div>
        {order.name}, {order.phone}
        <br />
        {order.addressLine}, {order.city}, {order.state}, {order.pincode}
      </div>

      <div className="mt-10">
        <Link href="/products" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}
