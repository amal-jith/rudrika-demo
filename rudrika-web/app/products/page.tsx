import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { searchProducts } from "@/lib/search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop sarees" };

type SP = { q?: string; category?: string; sort?: string; min?: string; max?: string; stock?: string; offer?: string; preorder?: string; band?: string };

const BANDS: [string, string, string | undefined, string | undefined][] = [
  ["under-5000", "Under Rs. 5,000", undefined, "5000"],
  ["5000-10000", "Rs. 5,000 to 10,000", "5000", "10000"],
  ["10000-20000", "Rs. 10,000 to 20,000", "10000", "20000"],
  ["above-20000", "Above Rs. 20,000", "20000", undefined],
];
const SORTS: [string, string | undefined][] = [["Newest", undefined], ["Price, low to high", "price-asc"], ["Price, high to low", "price-desc"], ["Name", "name"]];

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const { q, category, sort, stock, offer, preorder, band } = searchParams;
  let { min, max } = searchParams;
  const b = BANDS.find(([k]) => k === band);
  if (b) { min = b[2]; max = b[3]; }

  const where: any = { published: true };
  if (category) where.category = { slug: category };
  if (min || max) {
    where.price = {};
    if (min) where.price.gte = Math.round(parseFloat(min) * 100);
    if (max) where.price.lte = Math.round(parseFloat(max) * 100);
  }
  if (preorder === "1") where.preorder = true;
  if (stock === "in") where.OR = [{ preorder: true }, { variants: { some: { stock: { gt: 0 } } } }];

  const orderBy =
    sort === "price-asc" ? { price: "asc" as const }
    : sort === "price-desc" ? { price: "desc" as const }
    : sort === "name" ? { name: "asc" as const }
    : { createdAt: "desc" as const };

  const [allMatching, categories] = await Promise.all([
    db.product.findMany({ where, include: { category: true, variants: { select: { stock: true } }, reviews: { where: { approved: true }, select: { rating: true } } }, orderBy }),
    db.category.findMany({ where: { enabled: true }, orderBy: { sort: "asc" } }),
  ]);

  let products = searchProducts(allMatching, q);
  if (offer === "1") products = products.filter((p) => p.compareAt && p.compareAt > p.price);

  const qs = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, category, sort, min: b ? undefined : min, max: b ? undefined : max, stock, offer, preorder, band, ...over };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };
  const chip = (on: boolean) => `px-3 py-1.5 border text-sm ${on ? "bg-clay text-cream border-clay" : "border-ink/20 hover:border-ink"}`;
  const activeCount = [stock, offer, preorder, band, category].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl">{q ? `Search: ${q}` : category ? categories.find((c) => c.slug === category)?.name ?? "Shop" : "All sarees"}</h1>
          <p className="text-sm text-ink/50 mt-1">{products.length} {products.length === 1 ? "piece" : "pieces"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {SORTS.map(([label, val]) => <Link key={label} href={qs({ sort: val })} className={chip((sort ?? undefined) === val)}>{label}</Link>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Link href={qs({ category: undefined })} className={chip(!category)}>All fabrics</Link>
        {categories.map((c) => <Link key={c.id} href={qs({ category: c.slug })} className={chip(category === c.slug)}>{c.name}</Link>)}
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={qs({ stock: stock === "in" ? undefined : "in" })} className={chip(stock === "in")}>In stock</Link>
        <Link href={qs({ offer: offer === "1" ? undefined : "1" })} className={chip(offer === "1")}>On offer</Link>
        <Link href={qs({ preorder: preorder === "1" ? undefined : "1" })} className={chip(preorder === "1")}>Pre-order</Link>
        {BANDS.map(([k, label]) => <Link key={k} href={qs({ band: band === k ? undefined : k, min: undefined, max: undefined })} className={chip(band === k)}>{label}</Link>)}
        {activeCount > 0 && <Link href={q ? `/products?q=${encodeURIComponent(q)}` : "/products"} className="px-3 py-1.5 text-sm underline hover:text-clay">Clear filters</Link>}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-ink/50">No pieces match. <Link href="/products" className="underline">Clear filters</Link></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
