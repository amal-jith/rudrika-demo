import { db } from "@/lib/db";
import { saveTestimonial, toggleTestimonial, deleteTestimonial } from "@/lib/admin-actions";
import UploadField from "@/components/admin/UploadField";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminTestimonials() {
  await guardPage("testimonials");
  const items = await db.testimonial.findMany({ orderBy: { sort: "asc" } });
  const live = items.filter((t) => t.enabled).length;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Customer Reviews</h1>
      <p className="text-sm text-ink/60 mb-6">
        These slide across the homepage. {live} of {items.length} are showing.
      </p>

      <form action={saveTestimonial} className="admin-card mb-8 space-y-4">
        <h2 className="font-display text-xl">Add a review</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Customer name</label>
            <input name="name" required className="input" placeholder="Anjali S." />
          </div>
          <div>
            <label className="label">Stars</label>
            <select name="rating" defaultValue="5" className="input">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Review text</label>
          <textarea name="text" rows={2} required className="input" placeholder="Loved the fabric and the fit!" />
        </div>
        <UploadField name="image" label="Customer photo (optional)" />
        <button className="btn-primary">Add Review</button>
      </form>

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className={`admin-card ${!t.enabled ? "opacity-55" : ""}`}>
            <form action={saveTestimonial} className="space-y-3">
              <input type="hidden" name="id" value={t.id} />
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input name="name" required className="input !py-2" defaultValue={t.name} />
                </div>
                <select name="rating" defaultValue={String(t.rating)} className="input !py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <textarea name="text" rows={2} required className="input !py-2 text-sm" defaultValue={t.text} />
              <input type="hidden" name="image" value={t.image ?? ""} />
              <div className="flex items-center gap-4">
                <button className="btn-outline !py-1.5 !px-4 text-xs">Save</button>
              </div>
            </form>
            <div className="flex gap-4 mt-3 pt-3 border-t border-ink/5">
              <form action={toggleTestimonial}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs underline hover:text-clay">{t.enabled ? "Hide from site" : "Show on site"}</button>
              </form>
              <form action={deleteTestimonial}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs underline text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
