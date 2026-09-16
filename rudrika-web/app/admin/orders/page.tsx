import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/utils";
import { guardPage } from "@/lib/admin-guard";
import { can } from "@/lib/permissions";
import OrdersTable, { type OrderRow } from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string } }) {
  const me = await guardPage("orders");
  const showMoney = can(me.role, "reports");

  const where = searchParams.status ? { status: searchParams.status } : {};
  const orders = await db.order.findMany({
    where,
    include: { items: { select: { qty: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Flattened and serialised for the client table, Dates don't survive the
  // trip to a client component, and the full item rows aren't needed.
  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    name: o.name,
    email: o.email,
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    total: o.total,
    paymentStatus: o.paymentStatus,
    status: o.status,
  }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-3xl">Orders</h1>
        {showMoney && (
          /* Spreadsheet export, respects whichever status filter is showing */
          <div className="flex gap-2 text-sm">
            <a
              href={`/api/admin/orders/export${searchParams.status ? `?status=${searchParams.status}` : ""}`}
              download
              className="btn-outline !py-2 !px-4"
            >
              Export {searchParams.status ? searchParams.status.toLowerCase() : "all"} to CSV
            </a>
            <a href="/api/admin/orders/export?days=30" download className="btn-outline !py-2 !px-4">
              Last 30 days
            </a>
          </div>
        )}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap text-sm">
        <Link href="/admin/orders" className={`px-3 py-1.5 border ${!searchParams.status ? "bg-ink text-cream border-ink" : "border-ink/20"}`}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}
            className={`px-3 py-1.5 border ${searchParams.status === s ? "bg-ink text-cream border-ink" : "border-ink/20"}`}>
            {s}
          </Link>
        ))}
      </div>

      <OrdersTable orders={rows} showMoney={showMoney} />
    </div>
  );
}
