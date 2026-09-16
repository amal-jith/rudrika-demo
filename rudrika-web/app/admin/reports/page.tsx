import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR, ORDER_STATUSES } from "@/lib/utils";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const RANGES = [
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["90", "Last 3 months"],
  ["365", "Last year"],
  ["all", "All time"],
] as const;

/** Bar with a label and a number, used for every breakdown on this page. */
function Bar({ label, value, max, note }: { label: string; value: number; max: number; note: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex justify-between items-baseline gap-3 text-sm mb-1">
        <span className="min-w-0 truncate">{label}</span>
        <span className="text-ink/60 whitespace-nowrap text-xs">{note}</span>
      </div>
      <div className="h-1.5 bg-ink/10">
        <div className="h-full bg-clay" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminReports({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  await guardPage("reports");

  const range = searchParams.days ?? "30";
  const days = range === "all" ? null : parseInt(range, 10) || 30;
  const since = days ? new Date(Date.now() - days * 24 * 3600 * 1000) : null;

  // Revenue only counts money actually taken. An order sitting at PENDING
  // payment isn't income, and counting it would flatter every number here.
  const paidWhere = {
    paymentStatus: "PAID",
    status: { not: "CANCELLED" },
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  // Orders and their lines are fetched separately rather than as one nested
  // query. The totals only need the order rows, the breakdowns only need the
  // lines, and asking for each directly keeps both queries small.
  const [paidOrders, items, statusCounts, allOrdersInRange] = await Promise.all([
    db.order.findMany({
      where: paidWhere,
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.orderItem.findMany({
      where: { order: paidWhere },
      select: {
        name: true,
        qty: true,
        price: true,
        variantLabel: true,
        variant: { select: { colour: true } },
      },
    }),
    db.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: since ? { createdAt: { gte: since } } : {},
    }),
    db.order.count({ where: since ? { createdAt: { gte: since } } : {} }),
  ]);

  const revenue = paidOrders.reduce((n, o) => n + o.total, 0);
  const unitsSold = items.reduce((n, i) => n + i.qty, 0);
  const avgOrder = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;

  // ─── revenue by month, last 12 ───
  const byMonth = new Map<string, number>();
  for (const o of paidOrders) {
    const k = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + o.total);
  }
  const months = Array.from(byMonth.entries()).slice(-12);
  const maxMonth = Math.max(1, ...months.map(([, v]) => v));

  // ─── what's selling ───
  const tally = <T,>(rows: T[], key: (r: T) => string | null, amount: (r: T) => number) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = key(r);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + amount(r));
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };

  const byProductRevenue = tally(items, (i) => i.name, (i) => i.price * i.qty).slice(0, 10);
  const byProductUnits = new Map(tally(items, (i) => i.name, (i) => i.qty));
  const byColour = tally(items, (i) => i.variant?.colour ?? null, (i) => i.qty).slice(0, 12);
  const bySize = tally(items, (i) => i.variantLabel, (i) => i.qty).slice(0, 12);

  const maxProduct = Math.max(1, ...byProductRevenue.map(([, v]) => v));
  const maxColour = Math.max(1, ...byColour.map(([, v]) => v));
  const maxSize = Math.max(1, ...bySize.map(([, v]) => v));

  const statusMap = new Map(statusCounts.map((s) => [s.status, s._count._all]));

  const headline: [string, string][] = [
    ["Revenue", formatINR(revenue)],
    ["Paid Orders", String(paidOrders.length)],
    ["Average Order", formatINR(avgOrder)],
    ["Pieces Sold", String(unitsSold)],
  ];

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Reports</h1>
      <p className="text-sm text-ink/60 mb-6">
        Only paid, non-cancelled orders count towards revenue, an order that never got paid for
        isn&apos;t income.
      </p>

      <div className="flex gap-2 mb-8 flex-wrap text-sm">
        {RANGES.map(([v, label]) => (
          <Link
            key={v}
            href={`/admin/reports?days=${v}`}
            className={`px-3 py-1.5 border ${
              range === v ? "bg-ink text-cream border-ink" : "border-ink/20 hover:border-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {headline.map(([label, value]) => (
          <div key={label} className="admin-card">
            <div className="text-xs uppercase tracking-widest text-ink/50">{label}</div>
            <div className="font-display text-2xl mt-1">{value}</div>
          </div>
        ))}
      </div>

      {paidOrders.length === 0 ? (
        <div className="admin-card text-sm text-ink/50">
          No paid orders in this period. Try a wider range.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <section className="lg:col-span-2">
            <h2 className="font-display text-xl mb-3">Revenue by month</h2>
            <div className="admin-card">
              {months.map(([k, v]) => (
                <Bar
                  key={k}
                  label={new Date(`${k}-01`).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                  value={v}
                  max={maxMonth}
                  note={formatINR(v)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Best sellers</h2>
            <div className="admin-card">
              {byProductRevenue.map(([name, rev]) => (
                <Bar
                  key={name}
                  label={name}
                  value={rev}
                  max={maxProduct}
                  note={`${formatINR(rev)}, ${byProductUnits.get(name) ?? 0} sold`}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Order status</h2>
            <div className="admin-card !p-0 divide-y divide-ink/10">
              {ORDER_STATUSES.map((s) => (
                <div key={s} className="flex justify-between px-4 py-3 text-sm">
                  <span>{s}</span>
                  <span className="font-medium">{statusMap.get(s) ?? 0}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 text-sm text-ink/50">
                <span>All orders in period</span>
                <span className="font-medium">{allOrdersInRange}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Colours that move</h2>
            <div className="admin-card">
              {byColour.length === 0 ? (
                <p className="text-sm text-ink/50">
                  No colour data, these orders were for pieces sold in a single colour.
                </p>
              ) : (
                byColour.map(([c, n]) => (
                  <Bar key={c} label={c} value={n} max={maxColour} note={`${n} sold`} />
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Sizes that move</h2>
            <div className="admin-card">
              {bySize.length === 0 ? (
                <p className="text-sm text-ink/50">No size data.</p>
              ) : (
                bySize.map(([s, n]) => (
                  <Bar key={s} label={s} value={n} max={maxSize} note={`${n} sold`} />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
