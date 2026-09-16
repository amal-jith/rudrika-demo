import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://rudrika.in").replace(/\/+$/, "");
  const [products, posts, collections] = await Promise.all([
    db.product.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    db.collection.findMany({ select: { handle: true } }).catch(() => []),
  ]);
  const fixed = ["", "/products", "/collections", "/letters", "/gallery", "/about", "/contact", "/faq", "/size-guide", "/track", "/p/styling", "/p/shipping-policy", "/p/returns", "/p/privacy-policy", "/p/terms"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...collections.map((c: any) => ({ url: `${base}/collections/${c.handle}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...posts.map((p: any) => ({ url: `${base}/letters/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
