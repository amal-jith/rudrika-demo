export function formatINR(paise: number) {
  return "Rs. " + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseImages(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export const ORDER_STATUSES = ["PENDING", "PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const FREE_SHIPPING_ABOVE = 499900; // Rs. 4,999
export const SHIPPING_FLAT = 15000; // Rs. 150 per saree

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FLAT;
}
