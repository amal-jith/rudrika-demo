import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { savePost } from "@/lib/rudrika-actions";
import UploadField from "@/components/admin/UploadField";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit letter" };

export default async function EditPost({ params }: { params: { id: string } }) {
  await guardPage("blog");
  const post = params.id === "new" ? null : await db.post.findUnique({ where: { id: params.id } });
  if (params.id !== "new" && !post) notFound();
  const date = (post?.publishedAt ?? new Date()).toISOString().slice(0, 10);
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-6">{post ? "Edit letter" : "New letter"}</h1>
      <form action={savePost} className="admin-card space-y-4">
        {post && <input type="hidden" name="id" value={post.id} />}
        <div><label className="label">Title</label><input name="title" required className="input" defaultValue={post?.title ?? ""} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Slug (URL)</label><input name="slug" className="input" defaultValue={post?.slug ?? ""} placeholder="left blank, made from the title" /></div>
          <div><label className="label">Date</label><input name="publishedAt" type="date" className="input" defaultValue={date} /></div>
        </div>
        <div><label className="label">Short excerpt (shown on the list)</label><input name="excerpt" className="input" defaultValue={post?.excerpt ?? ""} /></div>
        <UploadField name="cover" label="Cover photo" defaultValue={post?.cover ?? ""} />
        <div><label className="label">Letter (blank line between paragraphs; lines starting with ## become headings)</label><textarea name="body" rows={18} required className="input text-sm" defaultValue={post?.body ?? ""} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={post?.published ?? true} /> Published</label>
        <button className="btn-primary">Save letter</button>
      </form>
    </div>
  );
}
