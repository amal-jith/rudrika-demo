/**
 * Loyalty points and the Rudrika Circle membership.
 * Points: earned when an order is marked delivered (per Rs. 100), on account
 * creation, on an approved review and on birthdays; redeemed at checkout up to
 * a share of the order. Tiers follow lifetime spend on delivered orders.
 * Every movement is a LoyaltyLedger row; User.loyaltyPoints is the running balance.
 */
import { db } from "./db";
import { getRudrikaSettings, num } from "./settings";

export type LoyaltyReason = "WELCOME" | "ORDER" | "REVIEW" | "BIRTHDAY" | "REDEEM" | "ADJUST" | "REVERSAL";

export async function addPoints(userId: string, delta: number, reason: LoyaltyReason, opts: { orderId?: string; note?: string } = {}) {
  if (!delta) return;
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
    if (!u) return;
    const next = Math.max(0, u.loyaltyPoints + delta);
    const applied = next - u.loyaltyPoints;
    if (!applied) return;
    await tx.loyaltyLedger.create({ data: { userId, delta: applied, reason, orderId: opts.orderId ?? null, note: opts.note ?? null } });
    await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: next } });
  });
}

export function tierFor(lifetimeSpend: number, s: { loyalty_tier_rose_paise: string; loyalty_tier_gold_paise: string }) {
  if (lifetimeSpend >= num(s.loyalty_tier_gold_paise, 2500000)) return "Gold";
  if (lifetimeSpend >= num(s.loyalty_tier_rose_paise, 1000000)) return "Rose";
  return "Silver";
}

export const TIER_PERKS: Record<string, string> = {
  Silver: "Points on every order",
  Rose: "Early access to new arrivals",
  Gold: "Free shipping and a styling call each season",
};

/** Called once when an order becomes DELIVERED. Idempotent. */
export async function earnForDeliveredOrder(orderId: string) {
  const o = await db.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, total: true, pointsEarned: true, status: true } });
  if (!o || !o.userId || o.pointsEarned > 0 || o.status !== "DELIVERED") return 0;
  const s = await getRudrikaSettings();
  const points = Math.floor((o.total / 100 / 100) * num(s.loyalty_earn_per_100, 1));
  await db.order.update({ where: { id: o.id }, data: { pointsEarned: points } });
  if (points > 0) await addPoints(o.userId, points, "ORDER", { orderId: o.id, note: "Delivered order" });
  const u = await db.user.findUnique({ where: { id: o.userId }, select: { lifetimeSpend: true } });
  const lifetime = (u?.lifetimeSpend ?? 0) + o.total;
  await db.user.update({ where: { id: o.userId }, data: { lifetimeSpend: lifetime, tier: tierFor(lifetime, s) } });
  return points;
}

/** How many points this customer may spend on an order of this subtotal. */
export function maxRedeemablePoints(subtotal: number, balance: number, s: { loyalty_max_redeem_percent: string; loyalty_point_value_paise: string }) {
  const pointValue = Math.max(1, num(s.loyalty_point_value_paise, 100));
  const cap = Math.floor((subtotal * num(s.loyalty_max_redeem_percent, 20)) / 100 / pointValue);
  return Math.max(0, Math.min(balance, cap));
}

export async function membershipStatus(userId: string | null | undefined) {
  if (!userId) return { active: false, expiresAt: null as Date | null };
  const u = await db.user.findUnique({ where: { id: userId }, select: { membershipExpiresAt: true } });
  const exp = u?.membershipExpiresAt ?? null;
  return { active: !!exp && exp.getTime() > Date.now(), expiresAt: exp };
}

/** Start or extend a membership by one year from the later of now and the current expiry. */
export async function activateMembership(userId: string, orderId: string | null, pricePaid: number) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { membershipExpiresAt: true } });
  const base = u?.membershipExpiresAt && u.membershipExpiresAt.getTime() > Date.now() ? u.membershipExpiresAt : new Date();
  const expiresAt = new Date(base);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  await db.membership.create({ data: { userId, orderId, startsAt: new Date(), expiresAt, pricePaid, active: true } });
  await db.user.update({ where: { id: userId }, data: { membershipExpiresAt: expiresAt } });
  return expiresAt;
}
