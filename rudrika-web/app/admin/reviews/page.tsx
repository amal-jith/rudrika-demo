import Link from "next/link";
import { StarIcon } from "@/components/Icons";
import { db } from "@/lib/db";
import { setReviewApproval, deleteReview } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await guardPage("reviews");
  const reviews = await db.review.findMany({
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Reviews</h1>
      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-ink/50 text-sm">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className={`admin-card ${!r.approved ? "border-clay/40" : ""}`}>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <div className="text-gold text-sm">{[1, 2, 3, 4, 5].map((k) => <StarIcon key={k} className="w-3.5 h-3.5 inline" filled={k <= r.rating} />)}</div>
                {r.title && <div className="font-medium mt-1">{r.title}</div>}
                <p className="text-sm text-ink/70 mt-1 max-w-xl">{r.body}</p>
                <div className="text-xs text-ink/40 mt-2">
                  {r.user.name} ({r.user.email}) on{" "}
                  <Link href={`/products/${r.product.slug}`} className="underline hover:text-clay">{r.product.name}</Link>{" "}
                 , {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2 py-1 ${r.approved ? "bg-green-100 text-green-700" : "bg-clay/10 text-clay"}`}>
                  {r.approved ? "Approved" : "Pending"}
                </span>
                <form action={setReviewApproval}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="approve" value={r.approved ? "0" : "1"} />
                  <button className="text-xs underline hover:text-clay">{r.approved ? "Unapprove" : "Approve"}</button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs underline text-red-600">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
