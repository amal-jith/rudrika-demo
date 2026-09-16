import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getRudrikaSettings, num } from "@/lib/settings";
import { maxRedeemablePoints, membershipStatus } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

/** The signed-in customer's points and membership, for the checkout page. */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const subtotal = Math.max(0, Math.round(Number(new URL(req.url).searchParams.get("subtotal") || 0)));
  const [u, s, m] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true, tier: true } }),
    getRudrikaSettings(),
    membershipStatus(user.id),
  ]);
  const balance = u?.loyaltyPoints ?? 0;
  return NextResponse.json({
    balance,
    tier: u?.tier ?? "Silver",
    max: maxRedeemablePoints(subtotal, balance, s),
    pointValue: num(s.loyalty_point_value_paise, 100),
    member: m.active,
    membershipExpiresAt: m.expiresAt,
    discountPercent: num(s.membership_discount_percent, 5),
  });
}
