import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can, isStaff, ROLE_LABELS, type Area, type StaffRole } from "@/lib/permissions";
import LogoutButton from "@/components/LogoutButton";

export const metadata = { title: "Admin" };

/**
 * Sidebar. Each entry carries the area it belongs to, and anything the signed-in
 * role can't reach simply isn't drawn, a dispatch account sees three links, not
 * thirteen greyed-out ones.
 *
 * Hiding the link is courtesy, not security. Every page guards itself and every
 * server action checks the same permission again, so typing the URL in by hand
 * gets you nowhere.
 */
const nav: [href: string, label: string, area: Area][] = [
  ["/admin", "Dashboard", "dashboard"],
  ["/admin/orders", "Orders", "orders"],
  ["/admin/stock", "Stock", "stock"],
  ["/admin/reports", "Reports", "reports"],
  ["/admin/products", "Products", "products"],
  ["/admin/categories", "Categories", "products"],
  ["/admin/collections", "Collections", "collections"],
  ["/admin/labels", "SKU labels", "labels"],
  ["/admin/invoices", "GST invoices", "invoices"],
  ["/admin/photos", "Wearing Rudrika photos", "photos"],
  ["/admin/loyalty", "Loyalty points", "loyalty"],
  ["/admin/membership", "Rudrika Circle", "membership"],
  ["/admin/blog", "Letters from Tara", "blog"],
  ["/admin/whatsapp", "WhatsApp", "whatsapp"],
  ["/admin/homepage", "Homepage", "homepage"],
  ["/admin/gallery", "Gallery", "gallery"],
  ["/admin/pages", "Website Pages", "pages"],
  ["/admin/testimonials", "Testimonials", "testimonials"],
  ["/admin/shipping", "Shipping", "shipping"],
  ["/admin/coupons", "Coupons", "coupons"],
  ["/admin/reviews", "Product Reviews", "reviews"],
  ["/admin/customers", "Customers", "customers"],
  ["/admin/users", "Staff", "staff"],
  ["/admin/settings", "Settings", "settings"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.active === false || !isStaff(user.role)) redirect("/login");

  const links = nav.filter(([, , area]) => can(user.role, area));
  const roleLabel = ROLE_LABELS[user.role as StaffRole] ?? user.role;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <aside>
        <div className="font-display text-xl">Admin Panel</div>
        <div className="text-xs text-ink/45 mb-4 mt-0.5">
          {user.name}, {roleLabel}
        </div>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 text-sm hover:bg-sand transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-ink/10 space-y-2">
          <Link href="/" className="block text-sm text-ink/50 hover:text-clay underline">
            View store
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
