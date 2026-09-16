import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { deletePost } from "@/lib/rudrika-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Letters from Tara" };

export default async function BlogAdmin() {
  await guardPage("blog");
  const posts = await db.post.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div><h1 className="font-display text-3xl mb-1">Letters from Tara</h1><p className="text-sm text-ink/60">The blog. Tara's own words, kept as written. Shown at /letters.</p></div>
        <Link href="/admin/blog/new" className="btn-primary !py-2.5">New letter</Link>
      </div>
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10"><th className="p-3">Title</th><th className="p-3">Published</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><Link className="font-medium hover:underline" href={`/admin/blog/${p.id}`}>{p.title}</Link><div className="text-xs text-ink/50">/letters/{p.slug}</div></td>
                <td className="p-3">{new Date(p.publishedAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">{p.published ? "Live" : "Draft"}</td>
                <td className="p-3 flex gap-3"><Link className="underline" href={`/letters/${p.slug}`} target="_blank">View</Link><form action={deletePost}><input type="hidden" name="id" value={p.id} /><button className="text-red-600 underline">Delete</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
