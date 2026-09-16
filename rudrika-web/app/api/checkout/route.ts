import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { parseImages } from "@/lib/utils";
import { shippingForOrder } from "@/lib/shipping";
import { razorpayEnabled, createRazorpayOrder } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/notify";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getRudrikaSettings, num } from "@/lib/settings";
import { maxRedeemablePoints, membershipStatus, addPoints } from "@/lib/loyalty";
import { assignInvoiceNumber } from "@/lib/gst";
import { waOrderConfirmed } from "@/lib/whatsapp-events";

/** "Bust 36\", Height 5'4\"", or null when the customer left both blank. */
function fitLine(raw: any): string | null {
  const clean = (v: any) => (typeof v === "string" ? v.trim().slice(0, 40) : "");
  const bust = clean(raw?.fitBust);
  const height = clean(raw?.fitHeight);
  const parts = [bust && `Bust ${bust}`, height && `Height ${height}`].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, name, email, phone, addressLine, city, state, pincode } = body;
    const whatsappOptIn = body.whatsappOptIn !== false;
    const pointsWanted = Math.max(0, Math.round(Number(body.points) || 0));

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    for (const f of [name, email, phone, addressLine, city, state, pincode])
      if (!f || typeof f !== "string")
        return NextResponse.json({ error: "Missing shipping details" }, { status: 400 });

    // Re-validate items & prices server-side
    const variantIds = items.map((i: any) => i.variantId);
    const variants = await db.variant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const i of items) {
      const v = variants.find((x) => x.id === i.variantId);
      const qty = Math.max(1, Math.min(20, parseInt(i.qty)));
      if (!v || !v.product.published)
        return NextResponse.json({ error: "An item in your cart is no longer available" }, { status: 400 });
      if (v.stock < qty && !v.product.preorder)
        return NextResponse.json(
          { error: `Only ${v.stock} left of ${v.product.name} (${v.label})` },
          { status: 400 }
        );
      const price = v.price ?? v.product.price;
      subtotal += price * qty;
      orderItems.push({
        productId: v.productId,
        variantId: v.id,
        name: v.product.name,
        variantLabel: v.label,
        image: parseImages(v.product.images)[0] ?? null,
        price,
        qty,
        sku: v.sku ?? null,
        hsn: v.product.hsn ?? null,
        gstRate: v.product.gstRate ?? 5,
        preorder: !!v.product.preorder,
        // Whatever the customer typed under the size picker. Trimmed and capped
        // so a pasted essay can't bloat the row or the WhatsApp message.
        fit: fitLine(i),
        // Not a column on OrderItem, carried alongside so the WhatsApp alert
        // can include the size chart. Stripped before the DB write below.
        measurements: v.product.measurements ?? null,
      });
    }

    // Coupon. A coupon bound to a customer (wearing-photo reward) only works
    // for that signed-in customer, and a single-use coupon works once.
    const sessionUser = await getUser();
    let discount = 0;
    let appliedCode: string | null = null;
    let appliedSingleUse = false;
    if (couponCode) {
      const c = await db.coupon.findUnique({ where: { code: String(couponCode).toUpperCase().trim() } });
      const cap = c ? (c.singleUse ? 1 : c.maxUses) : null;
      const valid =
        c &&
        c.active &&
        (!c.customerId || c.customerId === sessionUser?.id) &&
        (!c.expiresAt || c.expiresAt > new Date()) &&
        (cap == null || c.usedCount < cap) &&
        subtotal >= c.minOrder;
      if (valid && c) {
        discount = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
        appliedCode = c.code;
        appliedSingleUse = c.singleUse;
      }
    }

    // Signed-in customer, or a customer record created or matched by email or
    // phone for a guest order, so every order lands in the customer list.
    let user = sessionUser;
    const customer = user
      ? await db.user.findUnique({ where: { id: user.id } })
      : (await db.user.findFirst({ where: { OR: [{ email: String(email).toLowerCase() }, { phone: String(phone) }] } })) ??
        (await db.user.create({
          data: { name, email: String(email).toLowerCase(), phone: String(phone), whatsappOptIn, password: await bcrypt.hash(crypto.randomBytes(12).toString("base64url"), 10) },
        }));
    if (customer) await db.user.update({ where: { id: customer.id }, data: { whatsappOptIn, ...(customer.phone ? {} : { phone: String(phone) }) } });

    // Rudrika Circle members: a percentage off and free shipping, automatically.
    const rs = await getRudrikaSettings();
    const member = await membershipStatus(customer?.id);
    const membershipDiscount = member.active ? Math.round((subtotal * num(rs.membership_discount_percent, 5)) / 100) : 0;

    // Charged from the admin-managed zone that covers the delivery state.
    let shipping = await shippingForOrder(subtotal, state);
    if (member.active && rs.membership_free_shipping !== "0") shipping = 0;

    // Loyalty points, capped by the rule in Settings.
    const balance = customer?.loyaltyPoints ?? 0;
    const pointsRedeemed = Math.min(pointsWanted, maxRedeemablePoints(subtotal, balance, rs));
    const pointsValue = pointsRedeemed * Math.max(1, num(rs.loyalty_point_value_paise, 100));

    const total = Math.max(0, subtotal - discount - membershipDiscount - pointsValue) + shipping;
    const mock = !razorpayEnabled();

    // Create order + decrement stock atomically
    const order = await db.$transaction(async (tx) => {
      for (const oi of orderItems) {
        const updated = await tx.variant.updateMany({
          where: { id: oi.variantId, stock: { gte: oi.qty } },
          data: { stock: { decrement: oi.qty } },
        });
        if (updated.count === 0) throw new Error("STOCK");
      }
      if (appliedCode) {
        await tx.coupon.update({ where: { code: appliedCode }, data: { usedCount: { increment: 1 }, ...(appliedSingleUse ? { active: false } : {}) } });
      }
      const last = await tx.order.aggregate({ _max: { number: true } });
      return tx.order.create({
        data: {
          number: (last._max.number ?? 1000) + 1,
          userId: customer?.id ?? null,
          email, name, phone, addressLine, city, state, pincode,
          subtotal, discount, shipping, total,
          membershipDiscount, pointsRedeemed, pointsValue, whatsappOptIn,
          couponCode: appliedCode,
          status: mock ? "PLACED" : "PENDING",
          paymentStatus: mock ? "PAID" : "PENDING",
          paymentMethod: mock ? "MOCK" : "RAZORPAY",
          items: { create: orderItems.map(({ measurements, ...row }) => row) },
        },
      });
    });

    if (pointsRedeemed > 0 && customer) await addPoints(customer.id, -pointsRedeemed, "REDEEM", { orderId: order.id, note: `Order #${order.number}` });

    if (mock) {
      await assignInvoiceNumber(order.id);
      waOrderConfirmed(order);
      // No payment gateway configured, the order is complete right here,
      // so notify now. Deliberately not awaited: WhatsApp must never delay
      // the customer's confirmation screen.
      notifyOrderPlaced({
        number: order.number,
        name: order.name,
        phone: order.phone,
        email: order.email,
        addressLine: order.addressLine,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        total: order.total,
        paymentMethod: order.paymentMethod,
        orderId: order.id,
        items: orderItems.map((i) => ({
          name: i.name,
          variantLabel: i.variantLabel,
          qty: i.qty,
          measurements: i.measurements,
          fit: i.fit,
        })),
      });
      return NextResponse.json({ mock: true, orderId: order.id, orderNumber: order.number });
    }

    const rzpOrder = await createRazorpayOrder(total, `order_${order.number}`);
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

    return NextResponse.json({
      mock: false,
      orderId: order.id,
      orderNumber: order.number,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e: any) {
    if (e.message === "STOCK")
      return NextResponse.json({ error: "An item just went out of stock" }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
