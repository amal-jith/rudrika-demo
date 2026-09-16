import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseImages } from "@/lib/utils";
import ProductForm from "@/components/admin/ProductForm";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/** colourImages is stored as a JSON blob; never let a bad value break the page. */
function safeColourImages(json: string): Record<string, string[]> {
  try {
    const parsed = JSON.parse(json || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, (v as unknown[]).map(String)])
    );
  } catch {
    return {};
  }
}

export default async function EditProduct({ params }: { params: { id: string } }) {
  await guardPage("products");
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id: params.id }, include: { variants: true } }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
  ]);
  if (!product) notFound();

  const reviewCount = await db.review.count({ where: { productId: product.id } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-3xl">Edit: {product.name}</h1>
        <div className="flex gap-3 text-sm">
          <Link href={`/admin/products/${product.id}/reviews`} className="btn-outline !py-2 !px-4 text-xs">
            Reviews ({reviewCount})
          </Link>
          <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline !py-2 !px-4 text-xs">
            View on site
          </Link>
        </div>
      </div>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAt: product.compareAt,
          images: parseImages(product.images),
          videos: parseImages(product.videos),
          measurements: product.measurements,
          fabric: product.fabric,
          categoryId: product.categoryId,
          featured: product.featured,
          published: product.published,
          colourImages: safeColourImages(product.colourImages),
          variants: product.variants,
          productCode: product.productCode, hsn: product.hsn, gstRate: product.gstRate, silkMark: product.silkMark, preorder: product.preorder, earlyAccess: product.earlyAccess, care: product.care,
          tags: parseImages(product.tags), collections: parseImages(product.collections),
        }}
        categories={categories}
      />
    </div>
  );
}
