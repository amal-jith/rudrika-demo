import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

/**
 * Checks a coupon before checkout. Coupons earned by one customer (the
 * wearing-photo reward) only work for that customer while signed in, and a
 * single-use coupon stops after its first order.
 */
export async function POST(req: Request) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });

  const c = await db.coupon.findUnique({ where: { code: String(code).toUpperCase().trim() } });
  if (!c || !c.active) return NextResponse.json({ error: "Invalid coupon" }, { status: 404 });
  if (c.customerId) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in to use this coupon" }, { status: 401 });
    if (user.id !== c.customerId) return NextResponse.json({ error: "This coupon belongs to another account" }, { status: 403 });
  }
  if (c.expiresAt && c.expiresAt < new Date()) return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  const cap = c.singleUse ? 1 : c.maxUses;
  if (cap != null && c.usedCount >= cap) return NextResponse.json({ error: "This coupon has already been used" }, { status: 400 });
  if (subtotal < c.minOrder) return NextResponse.json({ error: `Minimum order of ${formatINR(c.minOrder)} required` }, { status: 400 });

  const discount = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return NextResponse.json({ code: c.code, discount });
}
