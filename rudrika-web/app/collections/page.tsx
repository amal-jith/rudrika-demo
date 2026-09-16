import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const [collections, categories] = await Promise.all([
    db.collection.findMany({ where: { enabled: true }, orderBy: { sort: "asc" } }),
    db.category.findMany({ where: { enabled: true }, orderBy: { sort: "asc" } }),
  ]);
  const Tile = ({ href, image, title, sub }: { href: string; image: string | null; title: string; sub?: string | null }) => (
    <Link href={href} className="group relative block aspect-[4/5] overflow-hidden bg-sand">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-clay-dark/80 to-transparent text-cream">
        <div className="font-display text-2xl">{title}</div>
        {sub && <div className="text-xs tracking-widest uppercase text-gold-light mt-1">{sub}</div>}
      </div>
    </Link>
  );
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
      <section>
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">Shop by fabric</div>
        <h1 className="font-display text-3xl sm:text-5xl mb-8">Every weave, a way of living</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((c) => <Tile key={c.id} href={`/products?category=${c.slug}`} image={c.image} title={c.name} />)}
        </div>
      </section>
      <section>
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-2">Curated</div>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">Collections for every moment</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {collections.map((c) => <Tile key={c.id} href={`/collections/${c.handle}`} image={c.image} title={c.title} sub={c.subtitle} />)}
        </div>
      </section>
    </div>
  );
}
