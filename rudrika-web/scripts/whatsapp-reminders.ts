/**
 * Scheduled WhatsApp reminders. Run once a day from cron on the server:
 *   0 10 * * * cd /var/www/rudrika-web && npx tsx scripts/whatsapp-reminders.ts >> logs/reminders.log 2>&1
 *
 * Three jobs, each idempotent:
 *   1. Feedback follow-up 5 days after delivery, asking for a wearing photo.
 *   2. Rudrika Circle renewal reminder 14 days before the membership ends.
 *   3. Birthday points on the customer's birthday.
 * Each event is switchable from Admin, Settings, and every send is logged in
 * Admin, WhatsApp. With no WhatsApp credentials the messages are logged as
 * queued, so the flow can be checked before Phase 2 switches it on.
 */
import { db } from "../lib/db";
import { getRudrikaSettings, num } from "../lib/settings";
import { waFeedback, waRenewal } from "../lib/whatsapp-events";
import { addPoints } from "../lib/loyalty";

const DAY = 86400000;

async function feedbackFollowUps() {
  const from = new Date(Date.now() - 6 * DAY);
  const to = new Date(Date.now() - 5 * DAY);
  const orders = await db.order.findMany({
    where: { status: "DELIVERED", deliveredAt: { gte: from, lte: to }, whatsappOptIn: true },
    select: { id: true, number: true, name: true, phone: true, total: true },
  });
  let sent = 0;
  for (const o of orders) {
    const already = await db.whatsAppLog.findFirst({ where: { orderId: o.id, event: "FEEDBACK" } });
    if (already) continue;
    await waFeedback(o);
    sent++;
  }
  console.log(`[reminders] feedback follow-ups: ${sent} of ${orders.length}`);
}

async function renewalReminders() {
  const from = new Date(Date.now() + 13 * DAY);
  const to = new Date(Date.now() + 14 * DAY);
  const users = await db.user.findMany({
    where: { membershipExpiresAt: { gte: from, lte: to }, whatsappOptIn: true },
    select: { id: true, name: true, phone: true, membershipExpiresAt: true },
  });
  let sent = 0;
  for (const u of users) {
    const already = await db.whatsAppLog.findFirst({ where: { userId: u.id, event: "RENEWAL", createdAt: { gte: new Date(Date.now() - 20 * DAY) } } });
    if (already) continue;
    await waRenewal(u, u.membershipExpiresAt!);
    sent++;
  }
  console.log(`[reminders] renewal reminders: ${sent} of ${users.length}`);
}

async function birthdayPoints() {
  const s = await getRudrikaSettings();
  const pts = num(s.loyalty_birthday_points, 0);
  if (pts <= 0) return console.log("[reminders] birthday points off");
  const today = new Date();
  const users = await db.user.findMany({ where: { birthday: { not: null }, role: "CUSTOMER" }, select: { id: true, birthday: true } });
  let given = 0;
  for (const u of users) {
    const b = u.birthday!;
    if (b.getDate() !== today.getDate() || b.getMonth() !== today.getMonth()) continue;
    const start = new Date(today.getFullYear(), 0, 1);
    const already = await db.loyaltyLedger.findFirst({ where: { userId: u.id, reason: "BIRTHDAY", createdAt: { gte: start } } });
    if (already) continue;
    await addPoints(u.id, pts, "BIRTHDAY", { note: `Birthday ${today.getFullYear()}` });
    given++;
  }
  console.log(`[reminders] birthday points: ${given}`);
}

async function main() {
  await feedbackFollowUps();
  await renewalReminders();
  await birthdayPoints();
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
