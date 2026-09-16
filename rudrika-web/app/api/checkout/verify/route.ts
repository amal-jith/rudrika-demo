import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/notify";
import { assignInvoiceNumber } from "@/lib/gst";
import { waOrderConfirmed } from "@/lib/whatsapp-events";
import { activateMembership } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.razorpayOrderId !== razorpay_order_id)
      return NextResponse.json({ error: "Order mismatch" }, { status: 400 });

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    // Guard against Razorpay calling us twice for the same payment -
    // without this the boutique would get duplicate WhatsApp alerts.
    const alreadyPaid = order.paymentStatus === "PAID";

    const updated = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "PLACED", razorpayPaymentId: razorpay_payment_id },
      // product is pulled in so the boutique's WhatsApp alert can carry the
      // measurement row for the size that was actually ordered.
      include: { items: { include: { product: true } } },
    });
    if (!alreadyPaid) {
      await assignInvoiceNumber(updated.id);
      waOrderConfirmed(updated);
      const membershipItem = await db.orderItem.findFirst({ where: { orderId: updated.id, sku: "RUDRIKA-CIRCLE" } });
      if (membershipItem && updated.userId) await activateMembership(updated.userId, updated.id, membershipItem.price);
    }

    if (!alreadyPaid) {
      // Not awaited, the customer shouldn't wait on WhatsApp to see their
      // confirmation page, and a messaging failure must not fail the payment.
      notifyOrderPlaced({
        number: updated.number,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        addressLine: updated.addressLine,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        total: updated.total,
        paymentMethod: updated.paymentMethod,
        orderId: updated.id,
        items: updated.items.map((i) => ({
          name: i.name,
          variantLabel: i.variantLabel,
          qty: i.qty,
          measurements: i.product?.measurements ?? null,
          fit: (i as any).fit ?? null,
        })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[checkout/verify]", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
