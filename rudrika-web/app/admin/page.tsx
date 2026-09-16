import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { guardPage } from "@/lib/admin-guard";
import { can } from "@/lib/permissions";
import { getLowStockThreshold } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const me = await guardPage("dashboard");

  // Dispatch accounts get the same dashboard minus the money. They need to see
  // what's arrived and what's running out; they have no business knowing the
  // month's takings.
  const seesMoney = can(me.role, "reports");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threshold = await getLowStockThreshold();

  const [orderCount, revenue, monthRevenue, customerCount, productCount, pendingReviews, lowStock, lowStockCount, recentOrders] =
    await Promise.all([
      db.order.count({ where: { status: { not: "CANCELLED" } } }),
      db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
      }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count(),
      db.review.count({ where: { approved: false } }),
      db.variant.findMany({
        where: { stock: { lte: threshold } },
        include: { product: { select: { name: true, id: true } } },
        orderBy: { stock: "asc" },
        take: 8,
      }),
      db.variant.count({ where: { stock: { lte: threshold } } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  const stats: [string, string][] = seesMoney
    ? [
        ["Total Revenue", formatINR(revenue._sum.total ?? 0)],
        ["This Month", formatINR(monthRevenue._sum.total ?? 0)],
        ["Orders", String(orderCount)],
        ["Customers", String(customerCount)],
        ["Products", String(productCount)],
        ["Reviews Pending", String(pendingReviews)],
      ]
    : [
        ["Orders", String(orderCount)],
        ["Needs Restocking", String(lowStockCount)],
      ];

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map(([label, value]) => (
          <div key={label} className="admin-card">
            <div className="text-xs uppercase tracking-widest text-ink/50">{label}</div>
            <div className="font-display text-2xl mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm underline hover:text-clay">All orders</Link>
          </div>
          <div className="admin-card !p-0 divide-y divide-ink/10">
            {recentOrders.length === 0 && <div className="p-4 text-sm text-ink/50">No orders yet.</div>}
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex justify-between items-center px-4 py-3 text-sm hover:bg-sand">
                <span>#{o.number}, {o.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-ink/50">{o.status}</span>
                  {seesMoney && <span className="font-medium">{formatINR(o.total)}</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl">
              Running Low <span className="text-ink/40 text-base">({lowStockCount})</span>
            </h2>
            <Link href="/admin/stock" className="text-sm underline hover:text-clay">See all stock</Link>
          </div>
          <div className="admin-card !p-0 divide-y divide-ink/10">
            {lowStock.length === 0 && <div className="p-4 text-sm text-ink/50">All stocked up.</div>}
            {lowStock.map((v) => (
              <Link key={v.id} href={`/admin/products/${v.product.id}`} className="flex justify-between items-center px-4 py-3 text-sm hover:bg-sand">
                {/* Colour matters here, "Kurta, M" tells you nothing when the
                    rust M is gone and the green M is fine. */}
                <span>
                  {v.product.name}, {v.colour ? `${v.colour}, ` : ""}{v.label}
                </span>
                <span className={v.stock === 0 ? "text-red-600 font-medium" : "text-clay font-medium"}>
                  {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                </span>
              </Link>
            ))}
            {lowStockCount > lowStock.length && (
              <Link href="/admin/stock" className="block px-4 py-3 text-sm text-ink/50 hover:bg-sand">
                and {lowStockCount - lowStock.length} more
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
