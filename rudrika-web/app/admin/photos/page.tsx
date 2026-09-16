import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { reviewPhoto, deletePhoto } from "@/lib/rudrika-actions";
import { getRudrikaSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wearing Rudrika photos" };

export default async function PhotosPage({ searchParams }: { searchParams: { status?: string } }) {
  await guardPage("photos");
  const status = (searchParams.status || "PENDING").toUpperCase();
  const [photos, counts, s] = await Promise.all([
    db.customerPhoto.findMany({ where: status === "ALL" ? {} : { status }, include: { user: { select: { name: true, email: true, phone: true } }, product: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } }),
    db.customerPhoto.groupBy({ by: ["status"], _count: { _all: true } }),
    getRudrikaSettings(),
  ]);
  const n = (k: string) => counts.find((c) => c.status === k)?._count._all ?? 0;
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Wearing Rudrika photos</h1>
      <p className="text-sm text-ink/60 mb-4">Customers upload a photo of themselves in their saree. Approving it shows the photo on the product page, creates a single-use {s.photo_coupon_percent}% coupon for that customer and sends the WhatsApp reward message.</p>
      <div className="flex gap-2 mb-6 text-sm">
        {[["PENDING", "Waiting"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["ALL", "All"]].map(([k, l]) => (
          <a key={k} href={`?status=${k}`} className={`px-3 py-1.5 border ${status === k ? "bg-clay text-cream border-clay" : "border-gold/40"}`}>{l}{k !== "ALL" ? ` (${n(k)})` : ""}</a>
        ))}
      </div>
      {photos.length === 0 && <div className="admin-card text-ink/50 text-sm">Nothing here.</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="admin-card !p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="w-full aspect-[3/4] object-cover mb-3" />
            <div className="text-sm font-medium">{p.user.name}</div>
            <div className="text-xs text-ink/50">{p.user.phone ?? p.user.email}{p.product ? `, ${p.product.name}` : ""}</div>
            {p.caption && <p className="text-sm mt-1">{p.caption}</p>}
            <div className="text-xs text-ink/50 mt-1">{new Date(p.createdAt).toLocaleDateString("en-IN")}, {p.status}{p.couponCode ? `, coupon ${p.couponCode}` : ""}{p.consent ? "" : ", no consent given"}</div>
            <div className="flex gap-2 mt-3">
              {p.status !== "APPROVED" && (
                <form action={reviewPhoto}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="approve" value="1" /><button className="btn-primary !py-1.5 !px-3 text-xs" disabled={!p.consent}>Approve</button></form>
              )}
              {p.status !== "REJECTED" && (
                <form action={reviewPhoto}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="approve" value="0" /><button className="btn-outline !py-1.5 !px-3 text-xs">Reject</button></form>
              )}
              <form action={deletePhoto}><input type="hidden" name="id" value={p.id} /><button className="text-xs text-red-600 underline">Delete</button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
