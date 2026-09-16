import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getRudrikaSettings } from "@/lib/settings";
import PhotoUpload from "@/components/account/PhotoUpload";

export const dynamic = "force-dynamic";
export const metadata = { title: "My photos and coupons" };

const STATUS: Record<string, string> = { PENDING: "Waiting for review", APPROVED: "Approved", REJECTED: "Not approved" };

export default async function PhotosPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [photos, coupons, ordered, s] = await Promise.all([
    db.customerPhoto.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } } } }),
    db.coupon.findMany({ where: { customerId: user.id }, orderBy: { createdAt: "desc" } }),
    db.orderItem.findMany({ where: { order: { userId: user.id } }, select: { productId: true, product: { select: { id: true, name: true } } }, distinct: ["productId"] }),
    getRudrikaSettings(),
  ]);
  const products = ordered.map((o) => o.product).filter((p): p is { id: string; name: string } => !!p);
  const allProducts = products.length ? products : await db.product.findMany({ where: { published: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 });
  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="space-y-8">
      <PhotoUpload products={allProducts} percent={s.photo_coupon_percent} />

      <section>
        <h2 className="font-display text-2xl mb-3">Your coupons</h2>
        {coupons.length === 0 ? <p className="text-sm text-ink/55 bg-white border border-gold/20 p-6">No coupons yet. An approved photo earns your first one.</p> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {coupons.map((c) => {
              const used = c.usedCount >= (c.maxUses ?? Infinity) || !c.active;
              const expired = !!c.expiresAt && c.expiresAt.getTime() < Date.now();
              return (
                <div key={c.id} className={`bg-white border p-4 text-sm ${used || expired ? "border-ink/10 opacity-60" : "border-gold/40"}`}>
                  <div className="font-mono text-lg tracking-wider">{c.code}</div>
                  <div className="text-ink/60 mt-1">{c.type === "PERCENT" ? `${c.value}% off` : `Rs. ${Math.round(c.value / 100)} off`}{c.singleUse ? ", one use" : ""}{c.expiresAt ? `, valid till ${fmt(c.expiresAt)}` : ""}</div>
                  <div className="text-xs mt-1">{used ? "Used" : expired ? "Expired" : "Enter this code at checkout"}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Your photos</h2>
        {photos.length === 0 ? <p className="text-sm text-ink/55 bg-white border border-gold/20 p-6">Nothing shared yet.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="bg-white border border-gold/20">
                <img src={p.image} alt={p.caption ?? "Wearing Rudrika"} className="w-full aspect-[3/4] object-cover" />
                <div className="p-3 text-xs"><div className="font-medium">{STATUS[p.status] ?? p.status}</div>{p.product && <div className="text-ink/55">{p.product.name}</div>}<div className="text-ink/45">{fmt(p.createdAt)}</div>{p.couponCode && <div className="text-clay mt-1">Coupon {p.couponCode}</div>}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
