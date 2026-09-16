/**
 * Import the Rudrika catalogue from data/DATA.json into the store database.
 * Idempotent: products match on slug, variants on sku, categories and
 * collections on name and handle, letters on slug. Running it twice updates,
 * never duplicates. Prices in DATA.json are rupees; the store keeps paise.
 * Images must already be downloaded by scripts/fetch-rudrika-images.js.
 *
 *   npx tsx scripts/import-rudrika.ts
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const ROOT = path.join(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "..", "data", "DATA.json"), "utf8"));
const CDN = "https://rudrika.in/cdn/shop/";

const CATEGORY_IMAGES: Record<string, string> = {
  Silk: "/uploads/campaign/rich-tile-silk.jpg",
  "Banarasi and Georgette": "/uploads/campaign/rich-tile-banarasi.jpg",
  "Tussar Silk": "/uploads/campaign/rich-tile-tussar.jpg",
  Linen: "/uploads/campaign/rich-tile-linen.jpg",
  Cotton: "/uploads/campaign/rich-tile-cotton.jpg",
  "Kota Doria": "/uploads/campaign/rich-tile-kota.jpg",
};
const CATEGORY_ORDER = ["Silk", "Banarasi and Georgette", "Tussar Silk", "Linen", "Cotton", "Kota Doria"];
const COLLECTION_IMAGES: Record<string, string> = {
  "saree-demo": "/uploads/campaign/rich-hero-purple.jpg",
  "best-sellers": "/uploads/campaign/rich-hero-orange.jpg",
  "unique-pieces": "/uploads/campaign/rich-navy.jpg",
  "rudrika-srees": "/uploads/campaign/rich-hero-red.jpg",
  "silk-saree": "/uploads/campaign/rich-tile-silk.jpg",
  linen: "/uploads/campaign/rich-tile-linen.jpg",
  "cotton-sarees": "/uploads/campaign/rich-tile-cotton.jpg",
  "tussar-silk": "/uploads/campaign/rich-tile-tussar.jpg",
  "kota-doria": "/uploads/campaign/rich-tile-kota.jpg",
  "fabrics-by-the-meter": "/uploads/campaign/rich-detail-zari.jpg",
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const paise = (rupees: number) => Math.round(Number(rupees) * 100);

async function fetchCover(url: string, slug: string): Promise<string | null> {
  const dir = path.join(ROOT, "public", "uploads", "letters");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.webp`);
  if (fs.existsSync(file)) return `/uploads/letters/${slug}.webp`;
  try {
    const sharp = (await import("sharp")).default;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(file);
    return `/uploads/letters/${slug}.webp`;
  } catch {
    return null;
  }
}

export async function importRudrika() {
  // Categories, one per fabric
  const catId: Record<string, string> = {};
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const name = CATEGORY_ORDER[i];
    const c = await db.category.upsert({
      where: { name },
      update: { image: CATEGORY_IMAGES[name], sort: i, enabled: true },
      create: { name, slug: slugify(name), image: CATEGORY_IMAGES[name], sort: i, enabled: true },
    });
    catId[name] = c.id;
  }

  // Collections
  const membership: Record<string, string[]> = {};
  for (let i = 0; i < DATA.collections.length; i++) {
    const c = DATA.collections[i];
    await db.collection.upsert({
      where: { handle: c.handle },
      update: { title: c.title, image: COLLECTION_IMAGES[c.handle] ?? null, sort: i, enabled: c.products.length > 0 },
      create: { handle: c.handle, title: c.title, image: COLLECTION_IMAGES[c.handle] ?? null, sort: i, enabled: c.products.length > 0 },
    });
    for (const h of c.products) (membership[h] ||= []).push(c.handle);
  }
  const best = new Set<string>(DATA.collections.find((c: any) => c.handle === "best-sellers")?.products ?? []);

  // Products and variants
  let np = 0, nv = 0;
  for (const p of DATA.products) {
    const prices = p.variants.map((v: any) => paise(v.price));
    const compares = p.variants.map((v: any) => paise(v.compare || 0));
    const price = Math.min(...prices);
    const compareAt = Math.max(...compares) > price ? Math.max(...compares) : null;
    const imgDir = path.join(ROOT, "public", "uploads", "products", p.handle);
    const images: string[] = [];
    p.images.forEach((_: string, i: number) => {
      if (fs.existsSync(path.join(imgDir, `${i + 1}.webp`))) images.push(`/uploads/products/${p.handle}/${i + 1}.webp`);
    });
    const hasOption = p.optionName && !["", "Title", "Default Title"].includes(p.optionName);
    const data = {
      name: p.title,
      description: p.description,
      price,
      compareAt,
      images: JSON.stringify(images),
      fabric: `${p.category}. ${p.care}`,
      care: p.care,
      categoryId: catId[p.category] ?? null,
      featured: best.has(p.handle),
      published: p.status === "active",
      productCode: p.code,
      hsn: p.hsn,
      gstRate: p.gst,
      silkMark: !!p.silkMark,
      preorder: !!p.preorder,
      tags: JSON.stringify(p.tags ?? []),
      collections: JSON.stringify(membership[p.handle] ?? []),
    };
    // Three Shopify handles were auto-named "untitled-<date>"; the slug is taken
    // from the title instead and next.config.mjs redirects the old paths.
    const slug = /^untitled-/.test(p.handle) ? slugify(p.title) : p.handle;
    const prod = await db.product.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    np++;
    for (const v of p.variants) {
      const vd = {
        productId: prod.id,
        label: "Free Size",
        colour: hasOption && v.title ? v.title : null,
        sku: v.sku,
        legacySku: v.legacy_sku || null,
        price: paise(v.price),
        stock: v.available ? 5 : 0, // placeholder counts; Tara corrects them in admin
      };
      const existing = await db.variant.findFirst({ where: { productId: prod.id, sku: v.sku } });
      if (existing) await db.variant.update({ where: { id: existing.id }, data: vd });
      else await db.variant.create({ data: vd });
      nv++;
    }
  }

  // Letters from Tara (blog), verbatim
  let nl = 0;
  for (const b of DATA.content.blog) {
    const cover = b.img ? await fetchCover(CDN + b.img, b.h) : null;
    const excerpt = (b.text || "").split("\n")[0].slice(0, 200);
    await db.post.upsert({
      where: { slug: b.h },
      update: { title: b.t, body: b.text, excerpt, cover, publishedAt: new Date(b.d + "T00:00:00+05:30"), published: true },
      create: { slug: b.h, title: b.t, body: b.text, excerpt, cover, publishedAt: new Date(b.d + "T00:00:00+05:30"), published: true },
    });
    nl++;
  }
  return { categories: CATEGORY_ORDER.length, collections: DATA.collections.length, products: np, variants: nv, letters: nl };
}

if (require.main === module) {
  importRudrika()
    .then((r) => { console.log("imported", r); return db.$disconnect(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
