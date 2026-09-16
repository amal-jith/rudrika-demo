import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { adjustPoints } from "@/lib/rudrika-actions";
import { getRudrikaSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";
import { TIER_PERKS } from "@/lib/loyalty";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loyalty points" };

export default async function LoyaltyPage({ searchParams }: { searchParams: { q?: string } }) {
  await guardPage("loyalty");
  const s = await getRudrikaSettings();
  const q = (searchParams.q || "").trim();
  const [customers, ledger] = await Promise.all([
    db.user.findMany({ where: { role: "CUSTOMER", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}) }, orderBy: { loyaltyPoints: "desc" }, take: 100 }),
    db.loyaltyLedger.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const rules = [
    [`${s.loyalty_earn_per_100} point per Rs. 100`, "on delivered orders"], [`1 point = ${formatINR(Number(s.loyalty_point_value_paise))}`, `redeem up to ${s.loyalty_max_redeem_percent}% of an order`],
    [`${s.loyalty_welcome_points} welcome points`, "on account creation"], [`${s.loyalty_review_points} points`, "per approved review"], [`${s.loyalty_birthday_points} points`, "on the customer's birthday"],
    [`Rose from ${formatINR(Number(s.loyalty_tier_rose_paise))}`, TIER_PERKS.Rose], [`Gold from ${formatINR(Number(s.loyalty_tier_gold_paise))}`, TIER_PERKS.Gold],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div><h1 className="font-display text-3xl mb-1">Loyalty points</h1><p className="text-sm text-ink/60">Rules are set under <Link className="underline" href="/admin/settings">Settings</Link>. Adjust any customer's balance here; every change is logged.</p></div>
        <form><input name="q" defaultValue={q} placeholder="Find a customer" className="input !py-2" /></form>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 text-sm">
        {rules.map(([a, b]) => <div key={a} className="admin-card"><div className="font-medium">{a}</div><div className="text-xs text-ink/50 mt-1">{b}</div></div>)}
      </div>
      <div className="admin-card !p-0 overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10"><th className="p-3">Customer</th><th className="p-3">Tier</th><th className="p-3">Lifetime spend</th><th className="p-3 text-right">Points</th><th className="p-3">Adjust</th></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-3"><div className="font-medium">{c.name}</div><div className="text-xs text-ink/50">{c.email}{c.phone ? `, ${c.phone}` : ""}</div></td>
                <td className="p-3">{c.tier}</td><td className="p-3">{formatINR(c.lifetimeSpend)}</td><td className="p-3 text-right font-medium">{c.loyaltyPoints}</td>
                <td className="p-3"><form action={adjustPoints} className="flex gap-1"><input type="hidden" name="userId" value={c.id} /><input name="delta" type="number" className="input !py-1 w-20" placeholder="+50" /><input name="note" className="input !py-1 w-32" placeholder="Reason" /><button className="btn-outline !py-1 !px-2 text-xs">Apply</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="font-display text-2xl mb-3">Recent movements</h2>
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm"><tbody className="divide-y divide-ink/5">
          {ledger.map((l) => <tr key={l.id}><td className="p-3 text-xs text-ink/50">{new Date(l.createdAt).toLocaleString("en-IN")}</td><td className="p-3">{l.user.name}</td><td className="p-3">{l.reason}{l.note ? `, ${l.note}` : ""}</td><td className={`p-3 text-right font-medium ${l.delta < 0 ? "text-red-600" : ""}`}>{l.delta > 0 ? "+" : ""}{l.delta}</td></tr>)}
          {ledger.length === 0 && <tr><td className="p-6 text-center text-ink/50">No points activity yet.</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}
