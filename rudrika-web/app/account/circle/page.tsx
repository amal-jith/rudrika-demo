import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { getRudrikaSettings, num } from "@/lib/settings";
import { membershipStatus } from "@/lib/loyalty";
import JoinCircle from "@/components/account/JoinCircle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rudrika Circle" };

export default async function CirclePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [s, m, history] = await Promise.all([getRudrikaSettings(), membershipStatus(user.id), db.membership.findMany({ where: { userId: user.id }, orderBy: { startsAt: "desc" } })]);
  const benefits = s.membership_benefits.split("\n").map((b) => b.trim()).filter(Boolean);
  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const soon = m.active && m.expiresAt && m.expiresAt.getTime() - Date.now() < 30 * 86400000;
  return (
    <div className="space-y-8">
      <section className="bg-clay text-cream p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.25em] text-gold-light">Membership</div>
        <h2 className="font-display text-3xl sm:text-4xl mt-1">{s.membership_name}</h2>
        {m.active ? (
          <p className="mt-3 text-cream/85">You are a member until {fmt(m.expiresAt!)}.{soon ? " Your membership ends soon, renew below to keep your benefits." : ""}</p>
        ) : (
          <p className="mt-3 text-cream/85">One year of member pricing and first access to new pieces, for {formatINR(num(s.membership_price_paise, 99900))}.</p>
        )}
      </section>

      <section className="bg-white border border-gold/20 p-6">
        <h3 className="font-display text-2xl mb-3">What members get</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-ink/75">{benefits.map((b) => <li key={b}>{b}</li>)}</ul>
        <p className="text-xs text-ink/50 mt-3">The {s.membership_discount_percent}% member discount{s.membership_free_shipping === "1" ? " and free shipping" : ""} apply automatically at checkout while you are signed in. Membership is billed once a year and does not renew on its own.</p>
        <div className="mt-5"><JoinCircle label={s.membership_name} priceLabel={formatINR(num(s.membership_price_paise, 99900))} renew={m.active} /></div>
      </section>

      {history.length > 0 && (
        <section>
          <h3 className="font-display text-2xl mb-3">Membership history</h3>
          <div className="bg-white border border-gold/20 divide-y divide-gold/15 text-sm">
            {history.map((h) => <div key={h.id} className="flex justify-between px-5 py-3"><span>{fmt(h.startsAt)} to {fmt(h.expiresAt)}</span><span>{formatINR(h.pricePaid)}</span></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
