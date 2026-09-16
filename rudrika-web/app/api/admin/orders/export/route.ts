import { db } from "@/lib/db";
import { requireCan } from "@/lib/auth";

/**
 * CSV export of orders, opens straight in Excel, Numbers or Google Sheets.
 *
 *   /api/admin/orders/export                  gives every order
 *   /api/admin/orders/export?status=PLACED    gives one status only
 *   /api/admin/orders/export?id=<orderId>     gives a single order
 *   /api/admin/orders/export?days=30          gives the last 30 days
 *
 * One row per line item, so a two-piece order produces two rows sharing the
 * same order number. That's the shape accountants and courier bulk-upload
 * tools expect.
 */

const HEADERS = [
  "Order Number",
  "Order ID",
  "Date",
  "Status",
  "Payment Status",
  "Payment Method",
  "Payment Ref",
  "Customer Name",
  "Phone",
  "Email",
  "Address",
  "City",
  "State",
  "PIN Code",
  "Product",
  "Size",
  "Customer Measurements",
  "Measurements For Size",
  "Fabric",
  "Qty",
  "Unit Price (INR)",
  "Line Total (INR)",
  "Order Subtotal (INR)",
  "Discount (INR)",
  "Coupon",
  "Shipping (INR)",
  "Order Total (INR)",
];

/** Excel-safe CSV escaping: quote everything, double any inner quotes. */
function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

const rupees = (paise: number) => (paise / 100).toFixed(2);

function sizeRow(measurements: string | null | undefined, label: string | null | undefined) {
  if (!measurements || !label) return "";
  const want = label.trim().toLowerCase();
  return (
    measurements
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.split(/[-\-–:]/)[0]?.trim().toLowerCase() === want) ?? ""
  );
}

export async function GET(req: Request) {
  await requireCan("reports");

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const id = url.searchParams.get("id");
  const days = Number(url.searchParams.get("days"));

  const where: any = {};
  if (id) where.id = id;
  if (status) where.status = status;
  if (days > 0) where.createdAt = { gte: new Date(Date.now() - days * 86400000) };

  const orders = await db.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { number: "desc" },
  });

  const lines = [HEADERS.map(cell).join(",")];

  for (const o of orders) {
    const common = [
      o.number,
      o.id,
      new Date(o.createdAt).toLocaleString("en-IN"),
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.razorpayPaymentId ?? "",
      o.name,
      o.phone,
      o.email,
      o.addressLine,
      o.city,
      o.state,
      o.pincode,
    ];
    const totals = [
      rupees(o.subtotal),
      rupees(o.discount),
      o.couponCode ?? "",
      rupees(o.shipping),
      rupees(o.total),
    ];

    if (o.items.length === 0) {
      lines.push([...common, "", "", "", "", "", "", "", ...totals].map(cell).join(","));
      continue;
    }

    for (const i of o.items) {
      lines.push(
        [
          ...common,
          i.name,
          i.variantLabel ?? "",
          (i as any).fit ?? "",
          sizeRow(i.product?.measurements, i.variantLabel),
          i.product?.fabric?.split("\n")[0] ?? "",
          i.qty,
          rupees(i.price),
          rupees(i.price * i.qty),
          ...totals,
        ]
          .map(cell)
          .join(",")
      );
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const name = id ? `rudrika-order-${orders[0]?.number ?? id}` : `rudrika-orders-${stamp}`;

  // The BOM makes Excel open UTF-8 (and the rupee sign) correctly.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
