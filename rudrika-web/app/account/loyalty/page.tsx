import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { getRudrikaSettings, num } from "@/lib/settings";
import { TIER_PERKS } from "@/lib/loyalty";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loyalty points" };

const REASONS: Record<string, string> = { WELCOME: "Welcome", ORDER: "Order", REVIEW: "Review", BIRTHDAY: "Birthday", REDEEM: "Redeemed", ADJUST: "Adjustment", REVERSAL: "Reversal" };

export default async function LoyaltyPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [u, ledger, s] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true, tier: true, lifetimeSpend: true, birthday: true } }),
    db.loyaltyLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    getRudrikaSettings(),
  ]);
  const pv = num(s.loyalty_point_value_paise, 100);
  const balance = u?.loyaltyPoints ?? 0;
  const tiers: [string, number][] = [["Silver", 0], ["Rose", num(s.loyalty_tier_rose_paise)], ["Gold", num(s.loyalty_tier_gold_paise)]];
  const next = tiers.find(([, t]) => t > (u?.lifetimeSpend ?? 0));
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gold/20 p-5"><div className="text-[11px] uppercase tracking-widest text-ink/50">Points balance</div><div className="font-display text-3xl mt-1">{balance}</div><div className="text-xs text-ink/50 mt-1">Worth {formatINR(balance * pv)} at checkout</div></div>
        <div className="bg-white border border-gold/20 p-5"><div className="text-[11px] uppercase tracking-widest text-ink/50">Your tier</div><div className="font-display text-3xl mt-1">{u?.tier ?? "Silver"}</div><div className="text-xs text-ink/50 mt-1">{TIER_PERKS[u?.tier ?? "Silver"]}</div></div>
        <div className="bg-white border border-gold/20 p-5"><div className="text-[11px] uppercase tracking-widest text-ink/50">Delivered spend</div><div className="font-display text-3xl mt-1">{formatINR(u?.lifetimeSpend ?? 0)}</div>{next && <div className="text-xs text-ink/50 mt-1">{formatINR(next[1] - (u?.lifetimeSpend ?? 0))} more to reach {next[0]}</div>}</div>
      </div>

      <section className="bg-white border border-gold/20 p-5 text-sm leading-relaxed">
        <h2 className="font-display text-2xl mb-2">How it works</h2>
        <ul className="list-disc pl-5 space-y-1 text-ink/70">
          <li>Earn {s.loyalty_earn_per_100} point for every Rs. 100 spent, credited when your order is delivered.</li>
          <li>Each point is worth {formatINR(pv)}. Redeem up to {s.loyalty_max_redeem_percent}% of an order at checkout.</li>
          <li>{s.loyalty_review_points} points for every approved review and {s.loyalty_birthday_points} on your birthday{u?.birthday ? "" : " (add your birthday in Profile)"}.</li>
          <li>Tiers: Silver, Rose from {formatINR(num(s.loyalty_tier_rose_paise))} and Gold from {formatINR(num(s.loyalty_tier_gold_paise))} of delivered orders.</li>
        </ul>
        <Link href="/account/circle" className="inline-block mt-3 underline hover:text-clay">Want more? See {s.membership_name}.</Link>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">History</h2>
        {ledger.length === 0 ? <p className="text-sm text-ink/55 bg-white border border-gold/20 p-6">No points activity yet.</p> : (
          <div className="bg-white border border-gold/20 divide-y divide-gold/15 text-sm">
            {ledger.map((l) => (
              <div key={l.id} className="flex justify-between gap-4 px-5 py-3">
                <div><div>{REASONS[l.reason] ?? l.reason}{l.note ? `: ${l.note}` : ""}</div><div className="text-xs text-ink/45">{new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></div>
                <div className={`font-medium ${l.delta < 0 ? "text-red-700" : "text-clay"}`}>{l.delta > 0 ? "+" : ""}{l.delta}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
