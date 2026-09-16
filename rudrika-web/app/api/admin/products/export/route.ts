import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Products CSV, one row per variant, with the generated SKUs. */
export async function GET() {
  try { await requireCan("products"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const products = await db.product.findMany({ include: { category: true, variants: true }, orderBy: { productCode: "asc" } });
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Product code", "SKU", "Legacy SKU", "Product", "Slug", "Fabric", "Variant", "Size", "Price (INR)", "Compare at (INR)", "Stock", "HSN", "GST %", "Silk Mark", "Pre-order", "Published", "Collections", "Tags"];
  const rows = [head.map(esc).join(",")];
  for (const p of products) for (const v of p.variants) {
    rows.push([p.productCode, v.sku, v.legacySku, p.name, p.slug, p.category?.name, v.colour ?? "", v.label, ((v.price ?? p.price) / 100).toFixed(2), p.compareAt ? (p.compareAt / 100).toFixed(2) : "", v.stock, p.hsn, p.gstRate, p.silkMark ? "yes" : "no", p.preorder ? "yes" : "no", p.published ? "yes" : "no", JSON.parse(p.collections || "[]").join(" "), JSON.parse(p.tags || "[]").join(" ")].map(esc).join(","));
  }
  return new NextResponse("﻿" + rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rudrika-products-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
