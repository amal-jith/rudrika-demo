import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PAGE_SEEDS } from "@/lib/page-defaults";
import { savePage } from "@/lib/admin-actions";
import PageBlocksEditor from "@/components/admin/PageBlocksEditor";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { slug: string } }) {
  await guardPage("pages");
  const existing = await db.page.findUnique({ where: { slug: params.slug } });
  const seed = PAGE_SEEDS.find((p) => p.slug === params.slug);
  if (!existing && !seed) notFound();

  let blocks: { heading: string; body: string }[] = seed?.blocks ?? [];
  if (existing) {
    try {
      blocks = JSON.parse(existing.blocks);
    } catch {}
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/pages" className="text-sm underline text-ink/50 hover:text-clay">Back to pages</Link>
      <h1 className="font-display text-3xl mt-3 mb-6">Edit: {existing?.title ?? seed?.title}</h1>

      <form action={savePage} className="space-y-5">
        {existing && <input type="hidden" name="id" value={existing.id} />}
        <input type="hidden" name="slug" value={params.slug} />

        <div>
          <label className="label">Page title</label>
          <input name="title" required className="input" defaultValue={existing?.title ?? seed?.title} />
        </div>
        <div>
          <label className="label">Sub-heading (shown under the title)</label>
          <textarea name="subtitle" rows={2} className="input" defaultValue={existing?.subtitle ?? seed?.subtitle ?? ""} />
        </div>

        <PageBlocksEditor initial={blocks} />

        <div className="flex gap-3">
          <button className="btn-primary">Save Page</button>
          <Link href={`/p/${params.slug}`} target="_blank" className="btn-outline">Preview</Link>
        </div>
      </form>
    </div>
  );
}
