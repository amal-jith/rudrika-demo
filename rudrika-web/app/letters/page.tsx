import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Letters from Tara" };

export default async function LettersPage() {
  const posts = await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-2xl mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">Letters from Tara</div>
        <h1 className="font-display text-3xl sm:text-5xl">Notes on fabric, care and the people who weave for us</h1>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((p) => (
          <Link key={p.id} href={`/letters/${p.slug}`} className="group block">
            <div className="aspect-[16/10] bg-sand overflow-hidden">
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : null}
            </div>
            <div className="text-xs text-ink/50 mt-4">{new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, Tara George</div>
            <h2 className="font-display text-2xl mt-1 group-hover:text-clay transition-colors">{p.title}</h2>
            {p.excerpt && <p className="text-sm text-ink/60 mt-2 line-clamp-3">{p.excerpt}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
