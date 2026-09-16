import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  await guardPage("customers");
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    include: { orders: { where: { paymentStatus: "PAID" }, select: { total: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6"><h1 className="font-display text-3xl">Customers</h1><a className="btn-outline !py-2 !px-4 text-sm" href="/api/admin/customers/export" download>Download CSV</a></div>
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Joined</th>
              <th className="p-3">Phone</th><th className="p-3">WhatsApp</th><th className="p-3">Points</th><th className="p-3">Tier</th><th className="p-3">Circle</th><th className="p-3">Orders</th><th className="p-3">Lifetime Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {customers.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-ink/50">No customers yet.</td></tr>}
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-ink/60">{c.email}</td>
                <td className="p-3 text-ink/60">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3 text-ink/60">{c.phone ?? ""}</td>
                <td className="p-3">{c.whatsappOptIn ? "Yes" : "No"}</td>
                <td className="p-3">{c.loyaltyPoints}</td>
                <td className="p-3">{c.tier}</td>
                <td className="p-3">{c.membershipExpiresAt && c.membershipExpiresAt > new Date() ? `Until ${c.membershipExpiresAt.toLocaleDateString("en-IN")}` : ""}</td>
                <td className="p-3">{c.orders.length}</td>
                <td className="p-3 font-medium">{formatINR(c.orders.reduce((n, o) => n + o.total, 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
