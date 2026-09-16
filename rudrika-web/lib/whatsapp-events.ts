/**
 * Rudrika WhatsApp events (Phase 2 automation, wired now, switchable per event
 * from Admin, Settings). Every message is logged in WhatsAppLog whether it was
 * sent, failed, or the event is switched off. Sending itself uses the Meta
 * Cloud API client in lib/notify.ts and needs WHATSAPP_TOKEN and
 * WHATSAPP_PHONE_NUMBER_ID in the server .env. Template names per event come
 * from the env so approved Meta templates can be swapped without a deploy.
 */
import { db } from "./db";
import { sendMessage, whatsappEnabled } from "./notify";
import { getRudrikaSettings, num } from "./settings";
import { formatINR } from "./utils";
import { STORE } from "./store-config";

export type WaEvent =
  | "ORDER_CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "FEEDBACK"
  | "PHOTO_REWARD" | "RENEWAL" | "WELCOME" | "MANUAL";

const SWITCH: Record<WaEvent, string> = {
  ORDER_CONFIRMED: "wa_order_confirmed", PACKED: "wa_packed", SHIPPED: "wa_shipped", DELIVERED: "wa_delivered",
  FEEDBACK: "wa_feedback", PHOTO_REWARD: "wa_photo_reward", RENEWAL: "wa_renewal", WELCOME: "wa_welcome", MANUAL: "wa_order_confirmed",
};
const TEMPLATE_ENV: Record<WaEvent, string> = {
  ORDER_CONFIRMED: "WHATSAPP_TEMPLATE_CUSTOMER", PACKED: "WHATSAPP_TEMPLATE_PACKED", SHIPPED: "WHATSAPP_TEMPLATE_SHIPPED",
  DELIVERED: "WHATSAPP_TEMPLATE_DELIVERED", FEEDBACK: "WHATSAPP_TEMPLATE_FEEDBACK", PHOTO_REWARD: "WHATSAPP_TEMPLATE_PHOTO_REWARD",
  RENEWAL: "WHATSAPP_TEMPLATE_RENEWAL", WELCOME: "WHATSAPP_TEMPLATE_WELCOME", MANUAL: "WHATSAPP_TEMPLATE_FEEDBACK",
};

const first = (name: string) => (name || "").trim().split(/\s+/)[0] || "there";

/** Queue, send and log one message. Never throws; callers do not await it on the request path. */
export async function sendEvent(event: WaEvent, opts: { to: string; text: string; params?: string[]; orderId?: string; userId?: string }) {
  const s = await getRudrikaSettings();
  const on = (s as any)[SWITCH[event]] !== "0";
  const template = process.env[TEMPLATE_ENV[event]] || undefined;
  const log = await db.whatsAppLog.create({
    data: { event, to: opts.to, template: template ?? null, text: opts.text, status: on ? "QUEUED" : "DISABLED", orderId: opts.orderId ?? null, userId: opts.userId ?? null },
  });
  if (!on) return log;
  if (!whatsappEnabled()) {
    // Phase 2 not switched on yet: keep the message queued so the admin can see
    // what would have gone out, and resend it once the Meta keys are in .env.
    return db.whatsAppLog.update({ where: { id: log.id }, data: { status: "QUEUED", error: "Waiting for WhatsApp connection" } });
  }
  try {
    await sendMessage(opts.to, template, opts.params ?? [], opts.text);
    return db.whatsAppLog.update({ where: { id: log.id }, data: { status: "SENT" } });
  } catch (e: any) {
    return db.whatsAppLog.update({ where: { id: log.id }, data: { status: "FAILED", error: String(e?.message ?? e).slice(0, 500) } });
  }
}

type O = { id: string; number: number; name: string; phone: string; total?: number; whatsappOptIn?: boolean | null; userId?: string | null; courier?: string | null; awb?: string | null };

export async function waOrderConfirmed(o: O) {
  if (o.whatsappOptIn === false) return;
  return sendEvent("ORDER_CONFIRMED", { to: o.phone, orderId: o.id, userId: o.userId ?? undefined, params: [first(o.name), String(o.number), formatINR(o.total ?? 0)],
    text: `Hi ${first(o.name)}, thank you for your order #${o.number} of ${formatINR(o.total ?? 0)} at Rudrika. We will pack it within ${STORE.shipping.dispatch}.` });
}
export async function waPacked(o: O) {
  if (o.whatsappOptIn === false) return;
  return sendEvent("PACKED", { to: o.phone, orderId: o.id, userId: o.userId ?? undefined, params: [first(o.name), String(o.number)],
    text: `Hi ${first(o.name)}, your Rudrika order #${o.number} is packed and will be handed to the courier shortly.` });
}
export async function waShipped(o: O) {
  if (o.whatsappOptIn === false) return;
  const via = o.courier ? ` with ${o.courier}` : "";
  const awb = o.awb ? `, tracking number ${o.awb}` : "";
  return sendEvent("SHIPPED", { to: o.phone, orderId: o.id, userId: o.userId ?? undefined, params: [first(o.name), String(o.number), o.courier ?? "", o.awb ?? ""],
    text: `Hi ${first(o.name)}, your Rudrika order #${o.number} is on its way${via}${awb}. Track it at ${STORE.shipping.tracking}.` });
}
export async function waDelivered(o: O) {
  if (o.whatsappOptIn === false) return;
  return sendEvent("DELIVERED", { to: o.phone, orderId: o.id, userId: o.userId ?? undefined, params: [first(o.name), String(o.number)],
    text: `Hi ${first(o.name)}, your Rudrika order #${o.number} has been delivered. Please record an unboxing video and tell us within 24 hours if anything is not right.` });
}
export async function waFeedback(o: O) {
  if (o.whatsappOptIn === false) return;
  const s = await getRudrikaSettings();
  return sendEvent("FEEDBACK", { to: o.phone, orderId: o.id, userId: o.userId ?? undefined, params: [first(o.name), s.photo_coupon_percent],
    text: `Hi ${first(o.name)}, did you like your saree? Share a photo of you wearing it from your account and get ${s.photo_coupon_percent}% off your next order.` });
}
export async function waPhotoReward(u: { id: string; name: string; phone: string | null }, code: string, percent: string) {
  if (!u.phone) return;
  return sendEvent("PHOTO_REWARD", { to: u.phone, userId: u.id, params: [first(u.name), code, percent],
    text: `Hi ${first(u.name)}, your photo is now on the Rudrika website. Thank you. Your coupon ${code} gives ${percent}% off your next order.` });
}
export async function waRenewal(u: { id: string; name: string; phone: string | null }, expiresAt: Date) {
  if (!u.phone) return;
  const s = await getRudrikaSettings();
  const d = expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return sendEvent("RENEWAL", { to: u.phone, userId: u.id, params: [first(u.name), s.membership_name, d],
    text: `Hi ${first(u.name)}, your ${s.membership_name} membership ends on ${d}. Renew from your account to keep your member benefits.` });
}
export async function waWelcome(u: { id: string; name: string; phone: string | null }) {
  if (!u.phone) return;
  const s = await getRudrikaSettings();
  return sendEvent("WELCOME", { to: u.phone, userId: u.id, params: [first(u.name), s.loyalty_welcome_points],
    text: `Hi ${first(u.name)}, welcome to Rudrika. ${s.loyalty_welcome_points} welcome points are in your account. Handloom and silk sarees, curated in Kochi.` });
}
export const na = num;
