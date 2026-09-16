import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.post.findUnique({ where: { slug: params.slug }, select: { title: true, excerpt: true } });
  return { title: p?.title ?? "Letter", description: p?.excerpt ?? undefined };
}

/** Tara's text is rendered verbatim: blank lines split paragraphs, "## " starts a heading. */
function render(body: string) {
  return body.split(/\n{2,}|\n/).map((l) => l.trim()).filter(Boolean).map((l, i) =>
    l.startsWith("### ") ? <h3 key={i} className="font-display text-xl mt-8 mb-2">{l.slice(4)}</h3>
    : l.startsWith("## ") ? <h2 key={i} className="font-display text-2xl mt-10 mb-3">{l.slice(3)}</h2>
    : <p key={i} className="mb-5 leading-relaxed">{l}</p>
  );
}

export default async function LetterPage({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) notFound();
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-xs text-ink/50 mb-2"><Link href="/letters" className="hover:text-clay">Letters from Tara</Link>, {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
      <h1 className="font-display text-3xl sm:text-5xl mb-6">{post.title}</h1>
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt="" className="w-full aspect-[16/9] object-cover mb-8" />
      )}
      <div className="text-[17px] text-ink/85">{render(post.body)}</div>
      <div className="mt-10 flex gap-3"><Link href="/letters" className="btn-outline">All letters</Link><Link href="/products" className="btn-primary">Shop sarees</Link></div>
    </article>
  );
}
