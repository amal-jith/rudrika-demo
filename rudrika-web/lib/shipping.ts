/**
 * Shipping rates, resolved from the ShippingZone table.
 *
 * A zone lists the states it covers. The first enabled zone whose list contains
 * the customer's delivery state wins. If no zone matches, the one marked
 * `isDefault` is used. If there are no zones at all, for example before the
 * v11 migration has run, we fall back to the old hardcoded rule so checkout
 * keeps working rather than erroring.
 */

import { db } from "./db";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "./utils";

export type Zone = {
  id: string;
  name: string;
  states: string[];
  rate: number;
  freeAbove: number | null;
  isDefault: boolean;
};

/** State names vary wildly in how people type them; compare loosely. */
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

export async function getZones(): Promise<Zone[]> {
  try {
    const rows = await db.shippingZone.findMany({
      where: { enabled: true },
      orderBy: { sort: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      states: safeStates(r.states),
      rate: r.rate,
      freeAbove: r.freeAbove,
      isDefault: r.isDefault,
    }));
  } catch {
    // Table doesn't exist yet (migration not run), behave as before.
    return [];
  }
}

function safeStates(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Work out what to charge. Always returns a number of paise, never throws.
 */
export async function shippingForOrder(subtotal: number, state?: string | null): Promise<number> {
  const zones = await getZones();

  if (zones.length === 0) {
    // Pre-migration fallback: the original flat rule.
    return subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FLAT;
  }

  const wanted = norm(state ?? "");
  const match =
    (wanted && zones.find((z) => z.states.some((s) => norm(s) === wanted))) ||
    zones.find((z) => z.isDefault) ||
    zones[0];

  if (!match) return SHIPPING_FLAT;
  if (match.freeAbove != null && subtotal >= match.freeAbove) return 0;
  return match.rate;
}

/** The cheapest "free above" across all zones, used for marketing copy. */
export async function lowestFreeThreshold(): Promise<number | null> {
  const zones = await getZones();
  const thresholds = zones.map((z) => z.freeAbove).filter((n): n is number => n != null);
  return thresholds.length ? Math.min(...thresholds) : null;
}
