import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const c = await db.collection.findUnique({ where: { handle: params.handle } });
  return { title: c?.title ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  const c = await db.collection.findUnique({ where: { handle: params.handle } });
  if (!c || !c.enabled) notFound();
  const all = await db.product.findMany({ where: { published: true }, include: { category: true, variants: { select: { stock: true } }, reviews: { where: { approved: true }, select: { rating: true } } }, orderBy: { createdAt: "desc" } });
  const products = all.filter((p) => { try { return JSON.parse(p.collections).includes(c.handle); } catch { return false; } });
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-xs text-ink/50 mb-2"><Link href="/collections" className="hover:text-clay">Collections</Link>, {products.length} saree{products.length === 1 ? "" : "s"}</div>
      <h1 className="font-display text-3xl sm:text-5xl">{c.title}</h1>
      {c.subtitle && <p className="text-ink/60 mt-2">{c.subtitle}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
        {products.map((p) => <ProductCard key={p.id} product={p as any} />)}
      </div>
      {products.length === 0 && <p className="text-ink/50 mt-8">Nothing in this collection yet.</p>}
    </div>
  );
}
