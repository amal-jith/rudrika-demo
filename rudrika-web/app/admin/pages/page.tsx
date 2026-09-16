import Link from "next/link";
import { db } from "@/lib/db";
import { PAGE_SEEDS } from "@/lib/page-defaults";
import { createPage, duplicatePage, deletePage } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminPages({ searchParams }: { searchParams: { saved?: string } }) {
  await guardPage("pages");
  const pages = await db.page.findMany({ orderBy: { slug: "asc" } });
  const bySlug = new Map(pages.map((p) => [p.slug, p]));

  const builtIn = PAGE_SEEDS.map((seed) => ({
    slug: seed.slug,
    title: bySlug.get(seed.slug)?.title ?? seed.title,
    customised: bySlug.has(seed.slug),
    id: bySlug.get(seed.slug)?.id,
    builtIn: true,
  }));
  const extras = pages
    .filter((p) => !PAGE_SEEDS.some((s) => s.slug === p.slug))
    .map((p) => ({ slug: p.slug, title: p.title, customised: true, id: p.id, builtIn: false }));

  const rows = [...builtIn, ...extras];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Website Pages</h1>
      <p className="text-sm text-ink/60 mb-6">
        Edit the words on your information pages, duplicate one as a starting point, or create a
        brand-new page.
      </p>

      {searchParams.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-5 text-sm">Page saved.</div>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.slug} className="admin-card flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-ink/50">
                /p/{r.slug}, {r.customised ? "edited" : "using default text"}
                {r.builtIn && ", built-in"}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <Link href={`/p/${r.slug}`} target="_blank" className="underline hover:text-clay">View</Link>
              <form action={duplicatePage}>
                <input type="hidden" name="slug" value={r.slug} />
                <button className="underline hover:text-clay">Duplicate</button>
              </form>
              {!r.builtIn && r.id && (
                <form action={deletePage}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="underline text-red-600">Delete</button>
                </form>
              )}
              <Link href={`/admin/pages/${r.slug}`} className="btn-primary !py-1.5 !px-4 text-xs">Edit</Link>
            </div>
          </div>
        ))}
      </div>

      <form action={createPage} className="admin-card mt-8 space-y-4">
        <h2 className="font-display text-xl">Create a new page</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Page title</label>
            <input name="title" required className="input" placeholder="Care Instructions" />
          </div>
          <div>
            <label className="label">Web address (optional)</label>
            <input name="slug" className="input" placeholder="care-instructions" />
          </div>
        </div>
        <div>
          <label className="label">Sub-heading (optional)</label>
          <input name="subtitle" className="input" placeholder="How to care for your Rudrika saree" />
        </div>
        <button className="btn-primary">Create Page</button>
        <p className="text-xs text-ink/40">
          New pages live at <code className="bg-sand px-1">/p/your-page</code>. Add a link to it in the
          footer by editing the code, or share the link directly on WhatsApp/Instagram.
        </p>
      </form>

      <div className="admin-card mt-6 text-sm text-ink/60 leading-relaxed">
        <h2 className="font-display text-xl mb-2 text-ink">Other editable content</h2>
        <p>
          <strong>Homepage</strong>, Admin, Homepage (blocks, banners, hero designs).<br />
          <strong>Contact details, phones, logo</strong>, Admin, Settings.<br />
          <strong>Products, sizes, measurements, photos</strong>, Admin, Products.<br />
          <strong>Homepage reviews</strong>, Admin, Testimonials.
        </p>
      </div>
    </div>
  );
}
