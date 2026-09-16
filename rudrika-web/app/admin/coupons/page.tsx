import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { saveCoupon, toggleCoupon, deleteCoupon } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  await guardPage("coupons");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Coupons</h1>

      <form action={saveCoupon} className="admin-card mb-8 grid sm:grid-cols-6 gap-3 items-end">
        <div><label className="label">Code</label><input name="code" required className="input !py-2 uppercase" placeholder="SUMMER20" /></div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="input !py-2">
            <option value="PERCENT">% off</option>
            <option value="FLAT">Rs. off</option>
          </select>
        </div>
        <div><label className="label">Value</label><input name="value" type="number" step="0.01" required className="input !py-2" placeholder="10" /></div>
        <div><label className="label">Min order (Rs.)</label><input name="minOrder" type="number" step="0.01" className="input !py-2" placeholder="0" /></div>
        <div><label className="label">Max uses</label><input name="maxUses" type="number" className="input !py-2" placeholder="∞" /></div>
        <div><label className="label">Expires</label><input name="expiresAt" type="date" className="input !py-2" /></div>
        <button className="btn-primary sm:col-span-6 sm:w-fit">Create / Update Coupon</button>
      </form>

      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
              <th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min Order</th>
              <th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {coupons.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink/50">No coupons yet.</td></tr>}
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-mono font-medium">{c.code}</td>
                <td className="p-3">{c.type === "PERCENT" ? `${c.value}%` : formatINR(c.value)}</td>
                <td className="p-3">{c.minOrder ? formatINR(c.minOrder) : "-"}</td>
                <td className="p-3">{c.usedCount}{c.maxUses != null && ` / ${c.maxUses}`}</td>
                <td className="p-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 ${c.active ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                    {c.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs underline hover:text-clay">{c.active ? "Disable" : "Enable"}</button>
                    </form>
                    <form action={deleteCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs underline text-red-600">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
