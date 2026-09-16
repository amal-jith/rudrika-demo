import Link from "next/link";
import { StarIcon } from "@/components/Icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminSaveReview, adminDeleteReview } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-gold text-sm">
      {[1, 2, 3, 4, 5].map((k) => <StarIcon key={k} className="w-3.5 h-3.5 inline" filled={k <= n} />)}
    </span>
  );
}

export default async function ProductReviews({ params }: { params: { id: string } }) {
  await guardPage("reviews");
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      reviews: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!product) notFound();

  const avg = product.reviews.length
    ? product.reviews.reduce((n, r) => n + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/products/${product.id}`} className="text-sm underline text-ink/50 hover:text-clay">
        Back to product
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-1">Reviews, {product.name}</h1>
      <p className="text-sm text-ink/60 mb-6">
        {product.reviews.length
          ? `${product.reviews.length} review${product.reviews.length > 1 ? "s" : ""}, average ${avg.toFixed(1)} of 5`
          : "No reviews yet."}{" "}
        Only approved reviews appear on the website.
      </p>

      {/* add new */}
      <form action={adminSaveReview} className="admin-card mb-8 space-y-4">
        <input type="hidden" name="productId" value={product.id} />
        <h2 className="font-display text-xl">Add a review</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Customer name</label>
            <input name="authorName" required className="input !py-2" placeholder="Anjali S." />
          </div>
          <div>
            <label className="label">Rating</label>
            <select name="rating" defaultValue="5" className="input !py-2">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Title (optional)</label>
          <input name="title" className="input !py-2" placeholder="Beautiful fabric" />
        </div>
        <div>
          <label className="label">Review</label>
          <textarea name="body" rows={3} required className="input !py-2" placeholder="What did the customer say?" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="approved" defaultChecked /> Show on the website straight away
        </label>
        <button className="btn-primary">Add Review</button>
      </form>

      {/* existing */}
      <div className="space-y-3">
        {product.reviews.map((r) => (
          <div key={r.id} className={`admin-card ${!r.approved ? "border-clay/40" : ""}`}>
            <form action={adminSaveReview} className="space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="authorName" value={r.user.name} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{r.user.name}</span>{" "}
                  <span className="text-xs text-ink/40">
                   , {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Stars n={r.rating} />
                  <select name="rating" defaultValue={String(r.rating)} className="input !py-1 !px-2 text-xs w-20">
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>
              <input name="title" className="input !py-2 text-sm" defaultValue={r.title ?? ""} placeholder="Title (optional)" />
              <textarea name="body" rows={2} required className="input !py-2 text-sm" defaultValue={r.body} />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="approved" defaultChecked={r.approved} /> Visible on website
                </label>
                <button className="btn-outline !py-1.5 !px-4 text-xs">Save</button>
              </div>
            </form>
            <form action={adminDeleteReview} className="mt-3 pt-3 border-t border-ink/5">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="productId" value={product.id} />
              <button className="text-xs underline text-red-600">Delete review</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
