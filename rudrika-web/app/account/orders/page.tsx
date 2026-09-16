import { redirect } from "next/navigation";
import { CheckIcon } from "@/components/Icons";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR, ORDER_STATUSES } from "@/lib/utils";
import Media from "@/components/Media";
import { requestCancelOrder } from "@/lib/account-actions";
import { WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Orders" };

const ACTIVE = ["PENDING", "PLACED", "SHIPPED"];

function Tracker({ status }: { status: string }) {
  const steps = ORDER_STATUSES.filter((s) => s !== "CANCELLED");
  const idx = steps.indexOf(status as any);
  if (status === "CANCELLED")
    return <div className="text-xs text-red-600 mt-2">This order was cancelled.</div>;
  return (
    <div className="flex items-center mt-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center ${
              i <= idx ? "bg-clay text-cream" : "bg-sand text-ink/40"
            }`}>{i < idx ? <CheckIcon className="w-3 h-3" /> : i + 1}</div>
            <span className="text-[9px] uppercase tracking-wider mt-1 text-ink/45">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-px flex-1 mx-1.5 ${i < idx ? "bg-clay" : "bg-ink/15"}`} />}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ o }: { o: any }) {
  const cancellable = ["PENDING", "PLACED"].includes(o.status);
  return (
    <div className="bg-white border border-gold/20 p-5">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <Link href={`/orders/${o.id}`} className="font-medium hover:text-clay">Order #{o.number}</Link>
          <div className="text-xs text-ink/50 mt-0.5">
            Placed {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">{formatINR(o.total)}</div>
          <div className={`text-xs ${o.paymentStatus === "PAID" ? "text-green-700" : "text-ink/50"}`}>
            {o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 overflow-x-auto">
        {o.items.map((it: any) => (
          <div key={it.id} className="flex gap-2 items-center shrink-0 bg-sand/50 pr-3">
            <div className="w-11">
              <Media src={it.image ?? undefined} alt={it.name} ratio="aspect-[3/4]" sizes="44px" />
            </div>
            <div className="text-xs">
              <div className="font-medium line-clamp-1 max-w-[150px]">{it.name}</div>
              <div className="text-ink/50">{it.variantLabel} x {it.qty}</div>
            </div>
          </div>
        ))}
      </div>

      <Tracker status={o.status} />

      <div className="flex gap-4 mt-4 pt-3 border-t border-ink/5 text-xs">
        <Link href={`/orders/${o.id}`} className="underline hover:text-clay">View details</Link>
        {cancellable && (
          <form action={requestCancelOrder}>
            <input type="hidden" name="id" value={o.id} />
            <button className="underline text-red-600">Cancel order</button>
          </form>
        )}
        <a
          href={`https://wa.me/919649641985?text=${encodeURIComponent(`Hi Rudrika, I have a question about order #${o.number}.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="underline text-[#1da851] ml-auto inline-flex items-center gap-1.5"
        >
          <WhatsAppIcon className="w-4 h-4" /> Ask about this order
        </a>
      </div>
    </div>
  );
}

export default async function MyOrders({ searchParams }: { searchParams: { tab?: string } }) {
  const user = await getUser();
  // The layout redirects too, but in the App Router layouts and pages render
  // in parallel, so each page has to guard on its own or it throws first.
  if (!user) redirect("/login");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const tab = searchParams.tab === "history" ? "history" : "active";
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const history = orders.filter((o) => !ACTIVE.includes(o.status));
  const list = tab === "active" ? active : history;

  return (
    <div>
      <div className="flex gap-2 mb-6 text-sm">
        <Link href="/account/orders"
          className={`px-4 py-2 border ${tab === "active" ? "bg-ink text-cream border-ink" : "border-ink/20 hover:border-ink"}`}>
          In progress ({active.length})
        </Link>
        <Link href="/account/orders?tab=history"
          className={`px-4 py-2 border ${tab === "history" ? "bg-ink text-cream border-ink" : "border-ink/20 hover:border-ink"}`}>
          Past orders ({history.length})
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-gold/20 p-10 text-center">
          <p className="text-ink/55 text-sm">
            {tab === "active" ? "No orders in progress right now." : "No past orders yet."}
          </p>
          <Link href="/products" className="btn-primary mt-5">Shop the Collection</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((o) => <OrderCard key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}
