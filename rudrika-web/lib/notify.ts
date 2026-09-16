/**
 * WhatsApp order notifications via the Meta WhatsApp Cloud API.
 *
 * Two messages go out when an order is confirmed:
 *   1. To the boutique  — full order details so they can start packing.
 *   2. To the customer  — a short confirmation with the order number.
 *
 * Configuration (.env):
 *   WHATSAPP_TOKEN              Permanent access token from Meta
 *   WHATSAPP_PHONE_NUMBER_ID    The "Phone number ID" (a long number, NOT the phone number)
 *   WHATSAPP_ADMIN_NUMBERS      Who gets the store alert, e.g. 919746386125,918281438152
 *   WHATSAPP_TEMPLATE_ADMIN     Approved template name for the store alert
 *   WHATSAPP_TEMPLATE_CUSTOMER  Approved template name for the customer confirmation
 *   WHATSAPP_TEMPLATE_LANG      Template language code (default: en)
 *
 * Behaviour without credentials: nothing is sent and the message is logged
 * instead, exactly like the Razorpay mock mode. Orders are never blocked.
 *
 * Meta requires an *approved template* for any message a business starts.
 * If the template names are left blank this falls back to a plain text message,
 * which only reaches numbers that have messaged you in the last 24 hours —
 * useful for testing before your templates are approved.
 */

import { formatINR } from "./utils";

const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappEnabled() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Strip spaces, dashes and a leading +; Meta wants digits only with country code. */
function normaliseNumber(raw: string): string | null {
  let n = (raw || "").replace(/[^\d]/g, "");
  if (!n) return null;
  // A bare 10-digit Indian mobile — add the country code.
  if (n.length === 10) n = "91" + n;
  // 0XXXXXXXXXX → drop the trunk prefix.
  if (n.length === 11 && n.startsWith("0")) n = "91" + n.slice(1);
  return n.length >= 11 ? n : null;
}

function adminNumbers(): string[] {
  return (process.env.WHATSAPP_ADMIN_NUMBERS || "")
    .split(",")
    .map((n) => normaliseNumber(n))
    .filter((n): n is string => Boolean(n));
}

async function send(payload: Record<string, any>) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp API ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

/**
 * Send one message. Uses an approved template when a name is given,
 * otherwise a plain text message.
 */
export async function sendMessage(to: string, template: string | undefined, params: string[], fallbackText: string) {
  if (template) {
    return send({
      to,
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text: text || "-" })),
          },
        ],
      },
    });
  }
  return send({ to, type: "text", text: { preview_url: false, body: fallbackText } });
}

export type OrderNotification = {
  number: number;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  total: number;
  paymentMethod: string;
  orderId?: string;
  items: {
    name: string;
    variantLabel: string;
    qty: number;
    /** The product's own size chart, as entered in the admin. */
    measurements?: string | null;
    /** What this customer typed for themselves, e.g. 'Bust 36" · Height 5\'4"'. */
    fit?: string | null;
  }[];
};

/**
 * Meta rejects a template variable that contains a newline, a tab, or four or
 * more consecutive spaces. Everything going into a {{n}} slot passes through
 * here first.
 */
function flatten(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** "Meera Silk Saree, Free Size x 1; Kota Doria Saree, Free Size x 1" */
function itemsLine(o: OrderNotification) {
  return flatten(
    o.items.map((i) => `${i.name}${i.variantLabel ? `, ${i.variantLabel}` : ""} x ${i.qty}`).join("; ")
  );
}

/** The row of the product's size chart matching the size that was ordered. */
function chartRow(i: OrderNotification["items"][number]): string | null {
  if (!i.measurements || !i.variantLabel) return null;
  const want = i.variantLabel.trim().toLowerCase();
  const row = i.measurements
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.split(/[—\-–:]/)[0]?.trim().toLowerCase() === want);
  return row ?? null;
}

/**
 * Any fit notes captured with the order, flattened onto one line for {{7}}.
 *
 * The customer's own numbers come first — those are what the piece gets cut to.
 * The product's standard chart row follows as a reference. Keeping both inside
 * this one variable means the approved Meta template never has to change.
 */
function measurementsLine(o: OrderNotification) {
  const parts = o.items
    .map((i) => {
      const chart = chartRow(i);
      const bits = [
        i.fit ? `customer ${i.fit}` : null,
        chart ? `standard ${chart}` : null,
      ].filter(Boolean);
      return bits.length ? `${i.name} (${i.variantLabel}): ${bits.join(" | ")}` : null;
    })
    .filter(Boolean);
  return parts.length ? flatten(parts.join(" · ")) : "See invoice for measurements";
}

/** Link to the printable invoice / packing slip for this order. */
function invoiceLink(o: OrderNotification) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://rudrika.in";
  return o.orderId ? `${site}/admin/orders/${o.orderId}/invoice` : `${site}/admin/orders`;
}

function adminText(o: OrderNotification) {
  return [
    `🛍 New order #${o.number}`,
    ``,
    `Customer: ${o.name}`,
    `Phone: ${o.phone}`,
    `Email: ${o.email}`,
    ``,
    `Items:`,
    ...o.items.map(
      (i) =>
        `• ${i.name} — Size ${i.variantLabel} × ${i.qty}` +
        (i.fit ? `\n   Customer: ${i.fit}` : "")
    ),
    ``,
    `Total: ${formatINR(o.total)} (${o.paymentMethod})`,
    ``,
    `Ship to:`,
    o.addressLine,
    `${o.city}, ${o.state} — ${o.pincode}`,
    ``,
    `Notes: ${measurementsLine(o)}`,
    ``,
    `Invoice: ${invoiceLink(o)}`,
  ].join("\n");
}

function customerText(o: OrderNotification) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://rudrika.in";
  return [
    `Hi ${o.name.split(" ")[0]}, thank you for shopping with Rudrika by Tara.`,
    ``,
    `Your order #${o.number} is confirmed.`,
    `Total: ${formatINR(o.total)}`,
    ``,
    `We will message you again the moment it ships. Reply here if you have any questions.`,
    ``,
    `Track it any time: ${site}/account/orders`,
  ].join("\n");
}

/**
 * Fire the notifications. Never throws — a messaging outage must not stop an
 * order from being placed, so every failure is caught and logged.
 */
export async function notifyOrderPlaced(order: OrderNotification): Promise<void> {
  const admins = adminNumbers();
  const customer = normaliseNumber(order.phone);

  if (!whatsappEnabled()) {
    console.log(
      "[whatsapp:mock] credentials not set — would have sent:\n" +
        `  → store (${admins.join(", ") || "no numbers configured"}):\n${adminText(order)}\n` +
        `  → customer (${customer ?? "unreadable number"}):\n${customerText(order)}`
    );
    return;
  }

  const jobs: Promise<unknown>[] = [];

  for (const to of admins) {
    jobs.push(
      sendMessage(
        to,
        process.env.WHATSAPP_TEMPLATE_ADMIN,
        // Order matters — these fill {{1}} … {{7}} of site_new_order.
        // If you change this list, change the template to match.
        [
          String(order.number),                                   // {{1}} order number
          order.name,                                             // {{2}} customer name
          order.phone,                                            // {{3}} customer phone
          itemsLine(order),                                       // {{4}} items with sizes
          formatINR(order.total),                                 // {{5}} total
          flatten(`${order.addressLine}, ${order.city}, ${order.state} — ${order.pincode}`), // {{6}} address
          measurementsLine(order),                                // {{7}} measurements
        ],
        adminText(order)
      ).catch((e) => console.error(`[whatsapp] store alert to ${to} failed:`, e.message))
    );
  }

  if (customer) {
    jobs.push(
      sendMessage(
        customer,
        process.env.WHATSAPP_TEMPLATE_CUSTOMER,
        [order.name.split(" ")[0], String(order.number), formatINR(order.total)],
        customerText(order)
      ).catch((e) => console.error(`[whatsapp] customer confirmation to ${customer} failed:`, e.message))
    );
  }

  await Promise.allSettled(jobs);
}

/** Optional: ping the customer when the order ships. */
export async function notifyOrderShipped(order: { number: number; name: string; phone: string }) {
  const to = normaliseNumber(order.phone);
  if (!to) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://rudrika.in";
  const text =
    `Good news ${order.name.split(" ")[0]}, your Rudrika by Tara order #${order.number} has shipped. ` +
    `Track it at ${site}/account/orders`;

  if (!whatsappEnabled()) {
    console.log(`[whatsapp:mock] shipped notice → ${to}:\n${text}`);
    return;
  }
  await sendMessage(to, process.env.WHATSAPP_TEMPLATE_SHIPPED, [order.name.split(" ")[0], String(order.number)], text).catch(
    (e) => console.error("[whatsapp] shipped notice failed:", e.message)
  );
}
