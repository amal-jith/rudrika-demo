/**
 * GST invoicing. Prices are GST inclusive, so the taxable value of a line is
 * gross / (1 + rate / 100). Deliveries within the store's state get CGST and
 * SGST (half each); everywhere else in India gets IGST. Confirm rates and HSN
 * codes with the client's CA before go-live.
 */
import { db } from "./db";
import { getRudrikaSettings } from "./settings";

export type GstLine = { name: string; sku?: string | null; hsn?: string | null; rate: number; qty: number; gross: number; taxable: number; tax: number };

export function gstBreakup(
  items: { name: string; sku?: string | null; hsn?: string | null; gstRate?: number | null; price: number; qty: number }[],
  deliveryState: string,
  homeState: string
) {
  const intra = (deliveryState || "").trim().toLowerCase() === (homeState || "").trim().toLowerCase();
  const lines: GstLine[] = items.map((i) => {
    const rate = i.gstRate ?? 5;
    const gross = i.price * i.qty;
    const taxable = Math.round(gross / (1 + rate / 100));
    return { name: i.name, sku: i.sku, hsn: i.hsn, rate, qty: i.qty, gross, taxable, tax: gross - taxable };
  });
  const taxable = lines.reduce((n, l) => n + l.taxable, 0);
  const tax = lines.reduce((n, l) => n + l.tax, 0);
  return {
    intra,
    lines,
    taxable,
    tax,
    cgst: intra ? Math.round(tax / 2) : 0,
    sgst: intra ? tax - Math.round(tax / 2) : 0,
    igst: intra ? 0 : tax,
  };
}

export const money2 = (paise: number) => (paise / 100).toFixed(2);

/**
 * Give a paid order its sequential invoice number, once. The running number
 * lives in Settings (invoice_prefix, invoice_next) so the client can see and
 * adjust it.
 */
export async function assignInvoiceNumber(orderId: string): Promise<string | null> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { invoiceNumber: true, paymentStatus: true } });
    if (!order) return null;
    if (order.invoiceNumber) return order.invoiceNumber;
    if (order.paymentStatus !== "PAID") return null;
    const s = await getRudrikaSettings();
    const next = Math.max(1, parseInt(s.invoice_next, 10) || 1);
    const invoiceNumber = `${s.invoice_prefix}${String(next).padStart(4, "0")}`;
    await tx.order.update({ where: { id: orderId }, data: { invoiceNumber, invoiceDate: new Date() } });
    await tx.setting.upsert({ where: { key: "invoice_next" }, update: { value: String(next + 1) }, create: { key: "invoice_next", value: String(next + 1) } });
    return invoiceNumber;
  });
}
