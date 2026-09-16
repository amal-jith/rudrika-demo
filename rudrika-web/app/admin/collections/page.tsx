import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { saveCollection, deleteCollection } from "@/lib/rudrika-actions";
import UploadField from "@/components/admin/UploadField";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

export default async function CollectionsAdmin() {
  await guardPage("collections");
  const [collections, products] = await Promise.all([db.collection.findMany({ orderBy: { sort: "asc" } }), db.product.findMany({ select: { collections: true } })]);
  const count = (h: string) => products.filter((p) => { try { return JSON.parse(p.collections).includes(h); } catch { return false; } }).length;
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Collections</h1>
      <p className="text-sm text-ink/60 mb-6">Curated groups such as New arrivals, Best sellers and Unique pieces. A saree joins a collection from its product page (Collections field, by handle). Fabric categories are managed under Categories.</p>
      <div className="grid lg:grid-cols-2 gap-4">
        {collections.map((c) => (
          <form key={c.id} action={saveCollection} className="admin-card space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Title</label><input name="title" required className="input" defaultValue={c.title} /></div>
              <div><label className="label">Handle (URL)</label><input name="handle" className="input" defaultValue={c.handle} /></div>
            </div>
            <div><label className="label">Subtitle</label><input name="subtitle" className="input" defaultValue={c.subtitle ?? ""} /></div>
            <UploadField name="image" label="Cover image" defaultValue={c.image ?? ""} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={c.enabled} /> Shown</label><label className="flex items-center gap-2">Order <input name="sort" type="number" className="input !py-1 w-16" defaultValue={c.sort} /></label><span className="text-ink/50">{count(c.handle)} sarees</span></div>
              <div className="flex gap-2"><button className="btn-primary !py-2 !px-4 text-sm">Save</button><button formAction={deleteCollection} className="text-xs text-red-600 underline">Delete</button></div>
            </div>
          </form>
        ))}
        <form action={saveCollection} className="admin-card space-y-3 border-dashed">
          <div className="font-medium">New collection</div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Title</label><input name="title" required className="input" /></div><div><label className="label">Handle</label><input name="handle" className="input" placeholder="from the title" /></div></div>
          <div><label className="label">Subtitle</label><input name="subtitle" className="input" /></div>
          <UploadField name="image" label="Cover image" defaultValue="" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked /> Shown</label>
          <input type="hidden" name="sort" value={collections.length} />
          <button className="btn-primary !py-2 !px-4 text-sm">Create</button>
        </form>
      </div>
    </div>
  );
}
