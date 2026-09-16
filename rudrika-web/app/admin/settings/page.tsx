import { db } from "@/lib/db";
import { saveSetting } from "@/lib/admin-actions";
import UploadField from "@/components/admin/UploadField";
import { STORE } from "@/lib/store-config";
import { DEFAULT_LOW_STOCK, RUDRIKA_DEFAULTS } from "@/lib/settings";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

type Field = { key: string; label: string; help?: string; fallback: string; kind?: "image" | "textarea" | "toggle" };
type Group = { title: string; intro: string; fields: Field[] };

const D = RUDRIKA_DEFAULTS;
const GROUPS: Group[] = [
  {
    title: "Store",
    intro: "Contact details, logo and the messages at the very top of the site. Changes appear everywhere immediately.",
    fields: [
      { key: "logo", label: "Store logo (must carry the TM mark)", fallback: STORE.logo, kind: "image" },
      { key: "whatsapp", label: "WhatsApp number (digits only, with country code)", help: "Used by every WhatsApp button and by the Phase 2 automation.", fallback: STORE.whatsapp },
      { key: "whatsapp_display", label: "Phone number as shown on the site", fallback: STORE.whatsappDisplay },
      { key: "email", label: "Main email", fallback: STORE.email },
      { key: "support_email", label: "Support email", fallback: STORE.supportEmail },
      { key: "hours", label: "Store hours (optional)", fallback: STORE.hours },
      { key: "branch1_name", label: "Store name", fallback: STORE.branches[0].name },
      { key: "branch1_address", label: "Store address", fallback: STORE.branches[0].address },
      { key: "branch1_phone", label: "Store phone", fallback: STORE.branches[0].phone },
      { key: "instagram", label: "Instagram link", fallback: STORE.social.instagram },
      { key: "announce1", label: "Top bar message 1", fallback: `Free shipping across India on orders above ${STORE.shipping.freeAbove}` },
      { key: "announce2", label: "Top bar message 2", fallback: "Handloom and silk sarees, curated in Kochi" },
      { key: "announce3", label: "Top bar message 3", fallback: `Help on WhatsApp ${STORE.whatsappDisplay}` },
      { key: "low_stock_threshold", label: "Warn me when stock drops to", help: "A saree with this many left or fewer shows on the Stock page and the Dashboard.", fallback: String(DEFAULT_LOW_STOCK) },
    ],
  },
  {
    title: "GST invoicing",
    intro: "Every paid order gets a sequential GST invoice. CGST and SGST apply for deliveries within this state, IGST for the rest of India. Prices are GST inclusive. Confirm the rates and HSN codes with your CA before go-live.",
    fields: [
      { key: "gstin", label: "GSTIN", help: "Leave blank until Rudrika supplies it; the invoice shows a placeholder.", fallback: D.gstin },
      { key: "legal_name", label: "Legal name on invoices", fallback: D.legal_name },
      { key: "gst_state", label: "Place of business, state", fallback: D.gst_state },
      { key: "gst_state_code", label: "State code", fallback: D.gst_state_code },
      { key: "invoice_prefix", label: "Invoice number prefix", help: "For example RUD/26-27/ followed by a four digit running number.", fallback: D.invoice_prefix },
      { key: "invoice_next", label: "Next invoice number", help: "Advances automatically with every invoice issued.", fallback: D.invoice_next },
    ],
  },
  {
    title: "Loyalty points",
    intro: "Points are earned when an order is marked delivered and redeemed at checkout. One point is worth the value below.",
    fields: [
      { key: "loyalty_earn_per_100", label: "Points earned per Rs. 100 spent", fallback: D.loyalty_earn_per_100 },
      { key: "loyalty_point_value_paise", label: "Value of one point, in paise", help: "100 paise = Rs. 1.", fallback: D.loyalty_point_value_paise },
      { key: "loyalty_max_redeem_percent", label: "Maximum share of an order payable with points, in percent", fallback: D.loyalty_max_redeem_percent },
      { key: "loyalty_welcome_points", label: "Welcome points on creating an account", fallback: D.loyalty_welcome_points },
      { key: "loyalty_review_points", label: "Points for an approved review", fallback: D.loyalty_review_points },
      { key: "loyalty_birthday_points", label: "Birthday points", fallback: D.loyalty_birthday_points },
      { key: "loyalty_tier_rose_paise", label: "Rose tier from lifetime spend, in paise", fallback: D.loyalty_tier_rose_paise },
      { key: "loyalty_tier_gold_paise", label: "Gold tier from lifetime spend, in paise", fallback: D.loyalty_tier_gold_paise },
    ],
  },
  {
    title: "Rudrika Circle membership",
    intro: "A paid annual membership bought through a normal order. Benefits apply automatically at checkout while the membership is active.",
    fields: [
      { key: "membership_name", label: "Plan name", fallback: D.membership_name },
      { key: "membership_price_paise", label: "Price per year, in paise", help: "99900 = Rs. 999.", fallback: D.membership_price_paise },
      { key: "membership_discount_percent", label: "Member discount on every order, in percent", fallback: D.membership_discount_percent },
      { key: "membership_free_shipping", label: "Members get free shipping (1 = yes, 0 = no)", fallback: D.membership_free_shipping },
      { key: "membership_benefits", label: "Benefits shown on the site, one per line", fallback: D.membership_benefits, kind: "textarea" },
    ],
  },
  {
    title: "Wearing Rudrika photo reward",
    intro: "When a customer photo is approved, a single-use coupon for this percentage is created for that customer.",
    fields: [{ key: "photo_coupon_percent", label: "Coupon percent", fallback: D.photo_coupon_percent }],
  },
  {
    title: "WhatsApp messages (Phase 2)",
    intro: "Each event can be switched on or off (1 = on, 0 = off). Messages are logged under WhatsApp in the admin. Sending needs the WhatsApp Business API keys in the server .env.",
    fields: [
      { key: "wa_order_confirmed", label: "Order confirmed", fallback: D.wa_order_confirmed, kind: "toggle" },
      { key: "wa_packed", label: "Packed", fallback: D.wa_packed, kind: "toggle" },
      { key: "wa_shipped", label: "Shipped, with courier and tracking number", fallback: D.wa_shipped, kind: "toggle" },
      { key: "wa_delivered", label: "Delivered", fallback: D.wa_delivered, kind: "toggle" },
      { key: "wa_feedback", label: "Feedback follow-up asking for a wearing photo", fallback: D.wa_feedback, kind: "toggle" },
      { key: "wa_photo_reward", label: "Photo approved, coupon message", fallback: D.wa_photo_reward, kind: "toggle" },
      { key: "wa_renewal", label: "Membership renewal reminder", fallback: D.wa_renewal, kind: "toggle" },
      { key: "wa_welcome", label: "Welcome on first sign-up", fallback: D.wa_welcome, kind: "toggle" },
    ],
  },
];

export default async function AdminSettings() {
  await guardPage("settings");
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Settings</h1>
      <p className="text-sm text-ink/60 mb-8">Store details and every programme rule, in one place. Each row saves on its own.</p>

      {GROUPS.map((g) => (
        <section key={g.title} className="mb-10">
          <h2 className="font-display text-2xl mb-1">{g.title}</h2>
          <p className="text-sm text-ink/60 mb-4">{g.intro}</p>
          <div className="space-y-3">
            {g.fields.map((f) => (
              <form key={f.key} action={saveSetting} className="admin-card">
                <input type="hidden" name="key" value={f.key} />
                {f.kind === "image" ? (
                  <>
                    <UploadField name="value" label={f.label} defaultValue={map.get(f.key) ?? f.fallback} />
                    <button className="btn-primary !py-2 !px-5 text-sm mt-3">Save</button>
                  </>
                ) : f.kind === "textarea" ? (
                  <>
                    <label className="label">{f.label}</label>
                    <textarea name="value" rows={5} className="input" defaultValue={map.get(f.key) ?? f.fallback} />
                    <button className="btn-primary !py-2 !px-5 text-sm mt-3">Save</button>
                  </>
                ) : (
                  <>
                    <label className="label">{f.label}</label>
                    <div className="flex gap-2">
                      <input name="value" className="input" defaultValue={map.get(f.key) ?? f.fallback} />
                      <button className="btn-primary !py-2 !px-5 text-sm shrink-0">Save</button>
                    </div>
                    {f.help && <p className="text-xs text-ink/40 mt-1.5">{f.help}</p>}
                  </>
                )}
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
