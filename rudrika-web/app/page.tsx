import { db } from "@/lib/db";
import { parseData } from "@/lib/section-types";
import Hero from "@/components/home/Hero";
import {
  CategoriesSection,
  ProductsSection,
  BannerSection,
  ValuesSection,
  TestimonialsSection,
  VideoSection,
  CtaSection,
  RichTextSection,
  PriceTiersSection,
  MarqueeSection,
  OccasionsSection,
} from "@/components/home/Sections";
import { getStore } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sections = await db.homeSection.findMany({
    where: { enabled: true },
    orderBy: { sort: "asc" },
  });

  const needs = (t: string) => sections.some((s) => s.type === t);

  const [categories, testimonials, store] = await Promise.all([
    needs("CATEGORIES")
      ? db.category.findMany({ where: { enabled: true }, orderBy: { sort: "asc" } })
      : Promise.resolve([]),
    needs("TESTIMONIALS")
      ? db.testimonial.findMany({ where: { enabled: true }, orderBy: { sort: "asc" } })
      : Promise.resolve([]),
    getStore(),
  ]);

  // Resolve product lists for each PRODUCTS section
  const productMap: Record<string, any[]> = {};
  await Promise.all(
    sections
      .filter((s) => s.type === "PRODUCTS")
      .map(async (s) => {
        const d = parseData(s.data, s.type);
        // Hard cap of 24 regardless of what's saved: the homepage must stay
        // light on mobile data no matter how large the catalogue grows.
        // Everything beyond this is reachable via the section's "View all" link.
        const take = Math.max(1, Math.min(24, Number(d.limit) || 8));
        const where: any = { published: true };
        let orderBy: any = { createdAt: "desc" };
        if (d.source === "featured") where.featured = true;
        if (d.source === "category" && d.categorySlug) where.category = { slug: d.categorySlug };
        productMap[s.id] = await db.product.findMany({ where, include: { category: true, variants: { select: { stock: true } } }, orderBy, take });
      })
  );

  const renderSection = (s: (typeof sections)[number]) => {
    const d = parseData(s.data, s.type);
    switch (s.type) {
      case "HERO":
        return <Hero d={d} whatsapp={store.whatsapp} />;
      case "PRICE_TIERS":
        return <PriceTiersSection d={d} />;
      case "MARQUEE":
        return <MarqueeSection d={d} />;
      case "OCCASIONS":
        return <OccasionsSection d={d} />;
      case "CATEGORIES":
        return <CategoriesSection d={d} categories={categories} />;
      case "PRODUCTS":
        return <ProductsSection d={d} products={productMap[s.id] ?? []} />;
      case "BANNER":
        return <BannerSection d={d} />;
      case "VALUES":
        return <ValuesSection d={d} />;
      case "TESTIMONIALS":
        return <TestimonialsSection d={d} testimonials={testimonials} />;
      case "VIDEO":
        return <VideoSection d={d} />;
      case "CTA":
        return <CtaSection d={d} />;
      case "RICHTEXT":
        return <RichTextSection d={d} />;
      default:
        return null;
    }
  };

  // The gallery lives on its own page only, the story circles looked cramped
  // squeezed between the homepage sections. It's still linked from the nav.
  return (
    <div>
      {sections.map((s) => (
        <div key={s.id}>{renderSection(s)}</div>
      ))}
    </div>
  );
}
