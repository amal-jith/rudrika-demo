/**
 * Who is allowed to see and change what in the Admin panel.
 *
 *   ADMIN          Owner (Tara) and Ryzenforge. Everything, including staff and Settings.
 *   MANAGER        A trusted person who runs the shop: orders, products, photos, content,
 *                  pricing, reports. Cannot open Settings or add staff.
 *   STORE_MANAGER  Ryzenforge's Phase 3 store-management service: products, stock, orders,
 *                  customers, reviews, photos, labels, invoices and the blog. No Settings,
 *                  no staff, no revenue reports.
 *   STAFF          Packing and dispatch. Orders, stock and labels only.
 *   CUSTOMER       A shopper. No admin access at all.
 *
 * The matrix is the single source of truth: the sidebar, the page guards and the
 * server actions all read from it.
 */

export const ROLES = ["ADMIN", "MANAGER", "STORE_MANAGER", "STAFF", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

/** Roles that can be handed out on the Staff page. CUSTOMER is not a job. */
export const STAFF_ROLES = ["ADMIN", "MANAGER", "STORE_MANAGER", "STAFF"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const AREAS = [
  "dashboard",
  "orders",
  "stock",
  "products",
  "labels",
  "invoices",
  "collections",
  "gallery",
  "photos",
  "homepage",
  "pages",
  "blog",
  "testimonials",
  "shipping",
  "coupons",
  "loyalty",
  "membership",
  "reviews",
  "customers",
  "whatsapp",
  "reports",
  "settings",
  "staff",
] as const;
export type Area = (typeof AREAS)[number];

const MATRIX: Record<Role, readonly Area[]> = {
  ADMIN: AREAS,
  MANAGER: [
    "dashboard", "orders", "stock", "products", "labels", "invoices", "collections", "gallery",
    "photos", "homepage", "pages", "blog", "testimonials", "shipping", "coupons", "loyalty",
    "membership", "reviews", "customers", "whatsapp", "reports",
  ],
  STORE_MANAGER: [
    "dashboard", "orders", "stock", "products", "labels", "invoices", "collections",
    "photos", "blog", "reviews", "customers",
  ],
  STAFF: ["dashboard", "orders", "stock", "labels"],
  CUSTOMER: [],
};

export function can(role: string | null | undefined, area: Area): boolean {
  if (!role) return false;
  const areas = MATRIX[role as Role];
  return !!areas && areas.includes(area);
}

/** True for anyone who should be let through the Admin front door at all. */
export function isStaff(role: string | null | undefined): boolean {
  return can(role, "dashboard");
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Owner",
  MANAGER: "Manager",
  STORE_MANAGER: "Store Manager",
  STAFF: "Dispatch",
};

export const ROLE_HELP: Record<StaffRole, string> = {
  ADMIN: "Everything, including Settings and adding staff. Give this out sparingly.",
  MANAGER: "Runs the shop: orders, products, photos, content, pricing, loyalty and reports. Cannot open Settings or add staff.",
  STORE_MANAGER: "Ryzenforge store management: products, stock, orders, customers, reviews, photos, labels, invoices and the blog. No Settings, staff or revenue reports.",
  STAFF: "Packing and dispatch. Orders, stock and labels only. No revenue, no customer list, no pricing.",
};
