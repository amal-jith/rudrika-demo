import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/auth";
import { gstBreakup, money2 } from "@/lib/gst";
import { getRudrikaSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** GST report: one row per invoice line, for the accountant. */
export async function GET(req: Request) {
  try { await requireCan("invoices"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const url = new URL(req.url);
  const from = url.searchParams.get("from"), to = url.searchParams.get("to");
  const where: any = { paymentStatus: "PAID" };
  if (from) where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(from) };
  if (to) where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(to + "T23:59:59") };
  const s = await getRudrikaSettings();
  const orders = await db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "asc" } });
  const head = ["Invoice number", "Invoice date", "Order number", "Customer", "Customer state", "Supply type", "Item", "SKU", "HSN", "Qty", "GST rate %", "Taxable value", "CGST", "SGST", "IGST", "Line total (incl. GST)", "Order shipping", "Order discounts", "Order total paid", "Razorpay payment id"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.map(esc).join(",")];
  for (const o of orders) {
    const g = gstBreakup(o.items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, gstRate: i.gstRate, hsn: i.hsn, sku: i.sku })), o.state, s.gst_state);
    g.lines.forEach((l) => {
      const half = Math.round(l.tax / 2);
      lines.push([o.invoiceNumber ?? "", new Date(o.invoiceDate ?? o.createdAt).toLocaleDateString("en-IN"), o.number, o.name, o.state, g.intra ? "Intra-state" : "Inter-state",
        l.name, l.sku ?? "", l.hsn ?? "", l.qty, l.rate, money2(l.taxable), g.intra ? money2(half) : "0.00", g.intra ? money2(l.tax - half) : "0.00", g.intra ? "0.00" : money2(l.tax), money2(l.gross),
        money2(o.shipping), money2(o.discount + o.membershipDiscount + o.pointsValue), money2(o.total), o.razorpayPaymentId ?? (o.paymentMethod === "MOCK" ? "mock" : "")].map(esc).join(","));
    });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rudrika-gst-report-${stamp}.csv"` } });
}
