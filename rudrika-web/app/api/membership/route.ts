import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getRudrikaSettings, num } from "@/lib/settings";
import { razorpayEnabled, createRazorpayOrder } from "@/lib/razorpay";
import { activateMembership } from "@/lib/loyalty";
import { assignInvoiceNumber } from "@/lib/gst";

/**
 * Join Rudrika Circle. The membership is bought through a normal order with a
 * single line (SKU RUDRIKA-CIRCLE), so it gets a GST invoice like any purchase.
 * Annual, no auto-renew. In mock mode the order completes here; with Razorpay
 * configured the client completes payment and /api/checkout/verify activates it.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const s = await getRudrikaSettings();
  const price = Math.max(0, num(s.membership_price_paise, 99900));
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const addr = await db.address.findFirst({ where: { userId: u.id }, orderBy: { isDefault: "desc" } });
  const mock = !razorpayEnabled();

  const order = await db.$transaction(async (tx) => {
    const last = await tx.order.aggregate({ _max: { number: true } });
    return tx.order.create({
      data: {
        number: (last._max.number ?? 1000) + 1,
        userId: u.id,
        email: u.email, name: u.name, phone: u.phone ?? "",
        addressLine: addr?.line1 ?? "", city: addr?.city ?? "", state: addr?.state ?? s.gst_state, pincode: addr?.pincode ?? "",
        subtotal: price, discount: 0, shipping: 0, total: price,
        status: mock ? "DELIVERED" : "PENDING",
        paymentStatus: mock ? "PAID" : "PENDING",
        paymentMethod: mock ? "MOCK" : "RAZORPAY",
        whatsappOptIn: u.whatsappOptIn,
        items: { create: [{ name: `${s.membership_name} membership, one year`, variantLabel: "Annual", price, qty: 1, sku: "RUDRIKA-CIRCLE", hsn: "9997", gstRate: 18 }] },
      },
    });
  });

  if (mock) {
    await assignInvoiceNumber(order.id);
    const expiresAt = await activateMembership(u.id, order.id, price);
    return NextResponse.json({ mock: true, orderId: order.id, orderNumber: order.number, expiresAt });
  }
  const rzp = await createRazorpayOrder(price, `membership_${order.number}`);
  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzp.id } });
  return NextResponse.json({ mock: false, orderId: order.id, orderNumber: order.number, razorpayOrderId: rzp.id, amount: price, keyId: process.env.RAZORPAY_KEY_ID });
}
