import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Customers CSV with contact details, WhatsApp opt-in, points, tier and membership. */
export async function GET() {
  try { await requireCan("customers"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const users = await db.user.findMany({ where: { role: "CUSTOMER" }, include: { addresses: { where: { isDefault: true }, take: 1 }, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } });
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Name", "Phone", "Email", "Address", "City", "State", "PIN", "WhatsApp opt-in", "Orders", "Loyalty points", "Tier", "Lifetime spend (INR)", "Rudrika Circle until", "Joined"];
  const rows = [head.map(esc).join(",")];
  for (const u of users) {
    const a = u.addresses[0];
    rows.push([u.name, u.phone, u.email, a ? [a.line1, a.line2].filter(Boolean).join(", ") : "", a?.city, a?.state, a?.pincode, u.whatsappOptIn ? "yes" : "no", u._count.orders, u.loyaltyPoints, u.tier, (u.lifetimeSpend / 100).toFixed(2), u.membershipExpiresAt ? u.membershipExpiresAt.toISOString().slice(0, 10) : "", u.createdAt.toISOString().slice(0, 10)].map(esc).join(","));
  }
  return new NextResponse("﻿" + rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rudrika-customers-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
