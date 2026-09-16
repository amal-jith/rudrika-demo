/**
 * Rudrika SKU scheme: RUD-<FABRIC>-<0000>-<VV>
 *   FABRIC  SLK Silk, BAN Banarasi and Georgette, TUS Tussar Silk, LIN Linen, COT Cotton, KOT Kota Doria
 *   0000    product number, running from 0001 in publish order; new products take the next number
 *   VV      variant number 01, 02, ...
 * Product codes and SKUs are generated once and never edited by hand. If a
 * product moves to another fabric, only the fabric segment is regenerated and
 * its number is kept, so the running sequence stays intact.
 */
import { db } from "./db";

export const FABRIC_CODES: Record<string, string> = {
  Silk: "SLK",
  "Banarasi and Georgette": "BAN",
  "Tussar Silk": "TUS",
  Linen: "LIN",
  Cotton: "COT",
  "Kota Doria": "KOT",
};

export function fabricCode(categoryName?: string | null): string {
  if (!categoryName) return "GEN";
  const exact = FABRIC_CODES[categoryName];
  if (exact) return exact;
  const k = Object.keys(FABRIC_CODES).find((n) => n.toLowerCase() === categoryName.toLowerCase());
  return k ? FABRIC_CODES[k] : "GEN";
}

export const pad4 = (n: number) => String(n).padStart(4, "0");
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** The next free product number across the whole catalogue. */
export async function nextProductNumber(): Promise<number> {
  const rows = await db.product.findMany({ where: { productCode: { not: null } }, select: { productCode: true } });
  let max = 0;
  for (const r of rows) {
    const m = /^RUD-[A-Z]{3}-(\d{4})$/.exec(r.productCode ?? "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

/**
 * Make sure a product and all its variants carry SKUs. Safe to call after every
 * save. Existing SKUs are kept; new variants get the next free suffix.
 */
export async function ensureSkus(productId: string) {
  const p = await db.product.findUnique({
    where: { id: productId },
    include: { category: true, variants: { orderBy: { id: "asc" } } },
  });
  if (!p) return;
  const code = fabricCode(p.category?.name);
  let productCode = p.productCode;
  if (!productCode) {
    productCode = `RUD-${code}-${pad4(await nextProductNumber())}`;
  } else {
    // fabric changed: keep the number, swap the fabric segment
    const m = /^RUD-([A-Z]{3})-(\d{4})$/.exec(productCode);
    if (m && m[1] !== code) productCode = `RUD-${code}-${m[2]}`;
  }
  if (productCode !== p.productCode) await db.product.update({ where: { id: p.id }, data: { productCode } });

  const used = new Set<number>();
  for (const v of p.variants) {
    const m = new RegExp(`^${productCode}-(\\d{2})$`).exec(v.sku ?? "");
    if (m) used.add(parseInt(m[1], 10));
  }
  let next = 1;
  const free = () => { while (used.has(next)) next++; used.add(next); return next; };
  for (const v of p.variants) {
    const ok = v.sku && v.sku.startsWith(productCode + "-");
    if (!ok) {
      // keep the old suffix number if the sku followed the scheme under another fabric code
      const m = /^RUD-[A-Z]{3}-\d{4}-(\d{2})$/.exec(v.sku ?? "");
      const n = m && !used.has(parseInt(m[1], 10)) ? (used.add(parseInt(m[1], 10)), parseInt(m[1], 10)) : free();
      await db.variant.update({ where: { id: v.id }, data: { sku: `${productCode}-${pad2(n)}` } });
    }
  }
}
