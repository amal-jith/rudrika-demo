import { db } from "./db";
import { STORE } from "./store-config";

/** Default for the low-stock warnings when nothing has been set in Admin. */
export const DEFAULT_LOW_STOCK = 3;

export async function getLowStockThreshold(): Promise<number> {
  try {
    const row = await db.setting.findUnique({ where: { key: "low_stock_threshold" } });
    const n = parseInt(row?.value ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LOW_STOCK;
  } catch {
    return DEFAULT_LOW_STOCK;
  }
}

async function settingsMap() {
  try {
    const rows = await db.setting.findMany();
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map<string, string>();
  }
}

/** Store details merged with any admin overrides saved in Settings. */
export async function getStore() {
  const map = await settingsMap();
  const g = (k: string, fallback: string) => (map.get(k)?.trim() ? map.get(k)!.trim() : fallback);
  const b = STORE.branches[0];
  return {
    ...STORE,
    logo: g("logo", STORE.logo),
    whatsapp: g("whatsapp", STORE.whatsapp),
    whatsappDisplay: g("whatsapp_display", STORE.whatsappDisplay),
    email: g("email", STORE.email),
    supportEmail: g("support_email", STORE.supportEmail),
    hours: g("hours", STORE.hours),
    branches: [
      { ...b, name: g("branch1_name", b.name), address: g("branch1_address", b.address), phone: g("branch1_phone", b.phone) },
    ],
    social: { instagram: g("instagram", STORE.social.instagram), facebook: g("facebook", STORE.social.facebook) },
    announcements: [
      g("announce1", `Free shipping across India on orders above ${STORE.shipping.freeAbove}`),
      g("announce2", "Handloom and silk sarees, curated in Kochi"),
      g("announce3", `Help on WhatsApp ${STORE.whatsappDisplay}`),
    ].filter(Boolean),
  };
}

/**
 * Rudrika programme settings: GST invoicing, loyalty, membership, photo reward
 * and the WhatsApp event switches. Every number is editable from Admin, Settings.
 */
export const RUDRIKA_DEFAULTS = {
  gstin: "",
  legal_name: STORE.legalName,
  gst_state: STORE.gst.stateName,
  gst_state_code: STORE.gst.stateCode,
  invoice_prefix: STORE.gst.invoicePrefix,
  invoice_next: "1",
  loyalty_earn_per_100: "1",
  loyalty_point_value_paise: "100",
  loyalty_max_redeem_percent: "20",
  loyalty_welcome_points: "50",
  loyalty_review_points: "25",
  loyalty_birthday_points: "100",
  loyalty_tier_rose_paise: "1000000",
  loyalty_tier_gold_paise: "2500000",
  membership_name: "Rudrika Circle",
  membership_price_paise: "99900",
  membership_discount_percent: "5",
  membership_free_shipping: "1",
  membership_benefits: "5% off every order, applied automatically\nFree shipping on all orders\nEarly access to new arrivals and unique pieces\nOne styling consultation with Tara each year\nBirthday bonus points",
  photo_coupon_percent: "2",
  wa_order_confirmed: "1",
  wa_packed: "1",
  wa_shipped: "1",
  wa_delivered: "1",
  wa_feedback: "1",
  wa_photo_reward: "1",
  wa_renewal: "1",
  wa_welcome: "1",
} as const;
export type RudrikaSettingKey = keyof typeof RUDRIKA_DEFAULTS;

export async function getRudrikaSettings(): Promise<Record<RudrikaSettingKey, string>> {
  const map = await settingsMap();
  const out = { ...RUDRIKA_DEFAULTS } as Record<RudrikaSettingKey, string>;
  for (const k of Object.keys(RUDRIKA_DEFAULTS) as RudrikaSettingKey[]) {
    const v = map.get(k);
    if (v !== undefined && v.trim() !== "") out[k] = v.trim();
  }
  return out;
}

export const num = (v: string, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
