import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { grantMembership, endMembership } from "@/lib/rudrika-actions";
import { getRudrikaSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rudrika Circle" };

export default async function MembershipPage({ searchParams }: { searchParams: { q?: string } }) {
  await guardPage("membership");
  const s = await getRudrikaSettings();
  const q = (searchParams.q || "").trim();
  const now = new Date();
  const [members, found] = await Promise.all([
    db.user.findMany({ where: { membershipExpiresAt: { not: null } }, orderBy: { membershipExpiresAt: "asc" }, include: { memberships: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    q ? db.user.findMany({ where: { role: "CUSTOMER", OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }, take: 10 }) : Promise.resolve([]),
  ]);
  const soon = new Date(now.getTime() + 14 * 86400000);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div><h1 className="font-display text-3xl mb-1">{s.membership_name}</h1><p className="text-sm text-ink/60">{formatINR(Number(s.membership_price_paise))} a year, {s.membership_discount_percent}% off every order{s.membership_free_shipping !== "0" ? " and free shipping" : ""}. Plan details are edited under <Link className="underline" href="/admin/settings">Settings</Link>. Renewal reminders go out on WhatsApp 14 days before expiry.</p></div>
        <form><input name="q" defaultValue={q} placeholder="Add a member: find a customer" className="input !py-2" /></form>
      </div>
      {found.length > 0 && (
        <div className="admin-card mb-6"><div className="text-sm font-medium mb-2">Grant a one-year membership</div>
          {found.map((u) => <form key={u.id} action={grantMembership} className="flex items-center justify-between gap-3 py-1 text-sm"><span>{u.name}, {u.email}</span><input type="hidden" name="userId" value={u.id} /><button className="btn-outline !py-1 !px-3 text-xs">Grant</button></form>)}
        </div>
      )}
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10"><th className="p-3">Member</th><th className="p-3">Since</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {members.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink/50">No members yet.</td></tr>}
            {members.map((m) => {
              const exp = m.membershipExpiresAt!; const active = exp > now; const expiring = active && exp < soon;
              return (
                <tr key={m.id}>
                  <td className="p-3"><div className="font-medium">{m.name}</div><div className="text-xs text-ink/50">{m.email}{m.phone ? `, ${m.phone}` : ""}</div></td>
                  <td className="p-3">{m.memberships[0] ? new Date(m.memberships[0].startsAt).toLocaleDateString("en-IN") : ""}</td>
                  <td className="p-3">{exp.toLocaleDateString("en-IN")}</td>
                  <td className="p-3">{active ? (expiring ? "Expiring soon" : "Active") : "Expired"}</td>
                  <td className="p-3 flex gap-2"><form action={grantMembership}><input type="hidden" name="userId" value={m.id} /><button className="btn-outline !py-1 !px-3 text-xs">Extend a year</button></form>{active && <form action={endMembership}><input type="hidden" name="userId" value={m.id} /><button className="text-xs text-red-600 underline">End</button></form>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
