import { db } from "@/lib/db";
import { saveCategory, deleteCategory, toggleCategory } from "@/lib/admin-actions";
import UploadField from "@/components/admin/UploadField";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  await guardPage("products");
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sort: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Categories</h1>
      <p className="text-sm text-ink/60 mb-6">
        Categories appear in the "Shop by Category" menu and on your homepage. Hide one to take it
        off the site without deleting it.
      </p>

      <form action={saveCategory} className="admin-card mb-8 space-y-4">
        <h2 className="font-display text-xl">Add a category</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Category name</label>
            <input name="name" required className="input" placeholder="Sarees" />
          </div>
          <div>
            <label className="label">Order (lower shows first)</label>
            <input name="sort" type="number" defaultValue={0} className="input" />
          </div>
        </div>
        <UploadField name="image" label="Category photo" />
        <button className="btn-primary">Add Category</button>
      </form>

      <div className="space-y-4">
        {categories.map((c) => (
          <div key={c.id} className={`admin-card ${!c.enabled ? "opacity-60" : ""}`}>
            <form action={saveCategory} className="flex flex-wrap items-end gap-4">
              <input type="hidden" name="id" value={c.id} />
              <div className="flex-1 min-w-[150px]">
                <label className="label">Name</label>
                <input name="name" required className="input !py-2" defaultValue={c.name} />
                <div className="text-xs text-ink/40 mt-1">/{c.slug}, {c._count.products} products</div>
              </div>
              <div className="w-20">
                <label className="label">Order</label>
                <input name="sort" type="number" className="input !py-2" defaultValue={c.sort} />
              </div>
              <div className="w-full sm:w-56">
                <UploadField name="image" label="Photo" defaultValue={c.image ?? ""} />
              </div>
              <button className="btn-outline !py-2 !px-4 text-xs">Save</button>
            </form>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-ink/5">
              <span className={`text-xs px-2 py-1 ${c.enabled ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                {c.enabled ? "Showing on site" : "Hidden"}
              </span>
              <form action={toggleCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs underline hover:text-clay">{c.enabled ? "Hide" : "Show"}</button>
              </form>
              <form action={deleteCategory} className="ml-auto">
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs underline text-red-600">Delete this category</button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink/40 mt-4">
        Deleting a category doesn't delete its products, they just become uncategorised.
      </p>
    </div>
  );
}
