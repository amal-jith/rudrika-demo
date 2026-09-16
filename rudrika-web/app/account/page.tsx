import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import Media from "@/components/Media";
import { parseImages } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVE = ["PENDING", "PLACED", "SHIPPED"];

export default async function AccountOverview() {
  const user = await getUser();
  // The layout redirects too, but in the App Router layouts and pages render
  // in parallel, so each page has to guard on its own or it throws first.
  if (!user) redirect("/login");

  const [orders, wishlistCount, addressCount, spend] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.wishlist.count({ where: { userId: user.id } }),
    db.address.count({ where: { userId: user.id } }),
    db.order.aggregate({ _sum: { total: true }, where: { userId: user.id, paymentStatus: "PAID" } }),
  ]);

  const active = orders.filter((o) => ACTIVE.includes(o.status));

  const stats = [
    ["Orders placed", String(orders.length ? await db.order.count({ where: { userId: user.id } }) : 0), "/account/orders"],
    ["In progress", String(active.length), "/account/orders"],
    ["Wishlist items", String(wishlistCount), "/account/wishlist"],
    ["Total spent", formatINR(spend._sum.total ?? 0), "/account/orders"],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="bg-white border border-gold/20 p-5 hover:border-gold transition-colors">
            <div className="text-[11px] uppercase tracking-widest text-ink/50">{label}</div>
            <div className="font-display text-2xl mt-1">{value}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm underline hover:text-clay">View all</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gold/20 p-8 text-center">
            <p className="text-ink/55 text-sm">You haven't placed an order yet.</p>
            <Link href="/products" className="btn-primary mt-5">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`}
                className="bg-white border border-gold/20 p-4 flex items-center gap-4 hover:border-gold transition-colors">
                <div className="flex -space-x-3 shrink-0">
                  {o.items.slice(0, 3).map((it) => (
                    <div key={it.id} className="w-12 border-2 border-white">
                      <Media src={it.image ?? undefined} alt={it.name} ratio="aspect-[3/4]" sizes="48px" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Order #{o.number}</div>
                  <div className="text-xs text-ink/50">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}, {o.items.length} item{o.items.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium">{formatINR(o.total)}</div>
                  <div className={`text-xs mt-0.5 ${
                    o.status === "DELIVERED" ? "text-green-700" : o.status === "CANCELLED" ? "text-red-600" : "text-clay"
                  }`}>{o.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link href="/account/addresses" className="bg-sand p-6 hover:bg-sand/70 transition-colors">
          <div className="font-display text-xl">Saved addresses</div>
          <p className="text-sm text-ink/55 mt-1">
            {addressCount ? `${addressCount} saved, checkout gets faster.` : "Save an address to check out in seconds."}
          </p>
        </Link>
        <Link href="/account/wishlist" className="bg-sand p-6 hover:bg-sand/70 transition-colors">
          <div className="font-display text-xl">Your wishlist</div>
          <p className="text-sm text-ink/55 mt-1">
            {wishlistCount ? `${wishlistCount} piece${wishlistCount > 1 ? "s" : ""} saved for later.` : "Tap the heart on any product to save it here."}
          </p>
        </Link>
      </section>
    </div>
  );
}
