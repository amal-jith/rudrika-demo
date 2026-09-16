import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import Media from "@/components/Media";
import TestimonialMarquee from "./TestimonialMarquee";
import CategoryRow from "./CategoryRow";
import { splitPair, splitTriple } from "@/lib/section-types";
import { waLink } from "@/lib/store-config";
import { WhatsAppIcon } from "@/components/Icons";

type D = Record<string, any>;

export function SectionHeading({ heading, sub, center = true }: { heading?: string; sub?: string; center?: boolean }) {
  if (!heading && !sub) return null;
  return (
    <div className={center ? "text-center" : ""}>
      {heading && <h2 className="font-display text-2xl sm:text-4xl">{heading}</h2>}
      {center && heading && <div className="gold-divider"><span className="gold-dot" /></div>}
      {sub && <p className="text-sm text-ink/55 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Categories ── */
export function CategoriesSection({ d, categories }: { d: D; categories: any[] }) {
  if (!categories.length) return null;
  const cards = d.style === "cards";
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <SectionHeading heading={d.heading} sub={d.subheading} />
      {cards ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-8 stagger">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="group relative aspect-[4/5] overflow-hidden zoom-frame bg-sand">
              {/* 2 columns until lg, then 4, the breakpoint here has to match. */}
              {c.image && <Image src={c.image} alt={c.name} fill sizes="(max-width:1023px) 50vw, 25vw" className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent flex items-end p-5">
                <span className="font-display text-xl text-cream">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <CategoryRow categories={categories} />
        </div>
      )}
    </section>
  );
}

/* ── Product row ── */
export function ProductsSection({ d, products }: { d: D; products: any[] }) {
  if (!products.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeading heading={d.heading} sub={d.subheading} center={false} />
        {d.linkLabel && (
          <Link href={d.linkHref || "/products"} className="text-sm underline underline-offset-4 hover:text-clay shrink-0">
            {d.linkLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 stagger">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ── Promo banner ── */
export function BannerSection({ d }: { d: D }) {
  // Two posters side by side
  if (d.mode === "pair" && (d.creative || d.creative2)) {
    const posters = [
      { src: d.creative, href: d.creativeHref },
      { src: d.creative2, href: d.creative2Href },
    ].filter((p) => p.src);
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className={`grid gap-4 sm:gap-5 ${posters.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {posters.map((p, i) => (
            <Link key={i} href={p.href || "/products"} className="block overflow-hidden group">
              <Image
                src={p.src}
                alt="Rudrika offer"
                width={1600}
                height={550}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // One wide designed poster
  if (d.mode === "creative" && d.creative) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link href={d.creativeHref || d.ctaHref || "/products"} className="block overflow-hidden group">
          <Image
            src={d.creative}
            alt={d.title || "Rudrika offer"}
            width={1600}
            height={600}
            sizes="100vw"
            className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.01]"
          />
        </Link>
      </section>
    );
  }

  const align =
    d.align === "center" ? "items-center text-center justify-center" : d.align === "right" ? "items-end text-right" : "items-start";
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="relative min-h-[300px] sm:min-h-[380px] overflow-hidden flex">
        {d.image && <Image src={d.image} alt={d.title || ""} fill className="object-cover" />}
        <div className="absolute inset-0 bg-ink/55" />
        <div className={`relative flex flex-col justify-center p-8 sm:p-14 text-cream w-full ${align}`}>
          {d.eyebrow && <div className="text-xs uppercase tracking-[0.3em] text-gold-light mb-3">{d.eyebrow}</div>}
          {d.title && <h2 className="font-display text-3xl sm:text-5xl max-w-lg leading-tight">{d.title}</h2>}
          {d.subtitle && <p className="mt-4 text-cream/75 max-w-md text-sm leading-relaxed">{d.subtitle}</p>}
          {d.ctaLabel && (
            <Link href={d.ctaHref || "/products"} className="btn-gold mt-7 w-fit">
              {d.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Values / trust strip ── */
export function ValuesSection({ d }: { d: D }) {
  const items = [d.item1, d.item2, d.item3, d.item4].map(splitPair).filter(([t]) => t);
  if (!items.length) return null;
  const dark = d.theme !== "light";
  return (
    <section className={dark ? "bg-ink text-cream" : "bg-sand text-ink"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {d.heading && (
          <h2 className={`font-display text-3xl text-center mb-8 ${dark ? "text-cream" : ""}`}>{d.heading}</h2>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {items.map(([t, s]) => (
            <div key={t}>
              <div className={`font-display text-lg mb-1 ${dark ? "text-gold-light" : "text-clay"}`}>{t}</div>
              <div className={`text-xs leading-relaxed ${dark ? "text-cream/50" : "text-ink/60"}`}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ── */
export function TestimonialsSection({ d, testimonials }: { d: D; testimonials: any[] }) {
  if (!testimonials.length) return null;
  return (
    <section className="bg-sand py-16">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading heading={d.heading} sub={d.subheading} />
      </div>
      <div className="mt-8">
        <TestimonialMarquee items={testimonials} speed={Number(d.speed) || 60} />
      </div>
    </section>
  );
}

/* ── Video ── */
export function VideoSection({ d }: { d: D }) {
  if (!d.video) return null;
  return (
    <section className="max-w-5xl mx-auto px-6 py-14 text-center">
      <SectionHeading heading={d.heading} sub={d.subheading} />
      <video
        src={d.video}
        poster={d.poster || undefined}
        controls
        playsInline
        preload="metadata"
        className="w-full mt-6 bg-ink aspect-video object-contain"
      />
    </section>
  );
}

/* ── CTA ── */
export function CtaSection({ d }: { d: D }) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 text-center">
      <h2 className="font-display text-3xl sm:text-5xl leading-tight">
        {d.title} {d.titleEm && <em className="text-clay">{d.titleEm}</em>}
      </h2>
      {d.subtitle && <p className="text-ink/60 mt-4 max-w-lg mx-auto">{d.subtitle}</p>}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        {d.ctaLabel && (
          <Link href={d.ctaHref || "/products"} className="btn-primary">
            {d.ctaLabel}
          </Link>
        )}
        {d.cta2Label &&
          (d.cta2Href === "whatsapp" ? (
            <a
              href={waLink("Hi Rudrika, I would like help choosing a saree.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2"
            >
              <WhatsAppIcon className="w-[1.1em] h-[1.1em]" /> {d.cta2Label}
            </a>
          ) : (
            <Link href={d.cta2Href || "/about"} className="btn-outline">
              {d.cta2Label}
            </Link>
          ))}
      </div>
    </section>
  );
}

/* ── Shop by budget (dark cards) ── */
export function PriceTiersSection({ d }: { d: D }) {
  const cards: any[] = (Array.isArray(d.cards) ? d.cards : []).filter(
    (c: any) => c && (c.title || c.subtitle)
  );
  if (!cards.length) return null;
  const cols = cards.length >= 4 ? "lg:grid-cols-4" : cards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {d.heading && <SectionHeading heading={d.heading} />}
      <div className={`grid grid-cols-2 ${cols} gap-4 sm:gap-5 mt-8 stagger`}>
        {cards.map((c, i) => (
          <Link key={i} href={c.href || "/products"} className="group relative aspect-[4/3] overflow-hidden lift">
            {c.image && (
              <Image src={c.image} alt={c.title || ""} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <div className="font-display text-cream text-base sm:text-xl leading-tight">{c.title}</div>
              {c.subtitle && <div className="font-display text-gold-light text-lg sm:text-2xl mt-1">{c.subtitle}</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Scrolling announcement strip ── */
export function MarqueeSection({ d }: { d: D }) {
  if (!d.text) return null;
  const theme =
    d.colour === "gold"
      ? "bg-gold text-ink"
      : d.colour === "clay"
      ? "bg-clay text-cream"
      : d.colour === "sand"
      ? "bg-sand text-ink border-y border-gold/30"
      : "bg-ink text-cream";
  const items = Array.from({ length: 8 });
  return (
    <Link href={d.href || "/products"} className={`block ${theme} overflow-hidden group`}>
      <div
        className="flex items-center gap-8 py-3.5 w-max marquee-bar"
        style={{ animationDuration: `${Math.max(20, Number(d.speed) || 55)}s` }}
      >
        {items.map((_, i) => (
          <span key={i} className="flex items-center gap-8 shrink-0">
            <span className="font-body text-[11px] sm:text-xs uppercase tracking-[0.28em] whitespace-nowrap">
              {d.text}
            </span>
            {d.badge && (
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] border border-current/40 px-3 py-1 whitespace-nowrap">
                {d.badge}
              </span>
            )}
            <span className="gold-dot" />
          </span>
        ))}
      </div>
    </Link>
  );
}

/* ── Shop by occasion (3 tall cards) ── */
export function OccasionsSection({ d }: { d: D }) {
  const cards: any[] = (Array.isArray(d.cards) ? d.cards : []).filter((c: any) => c && c.title);
  if (!cards.length) return null;
  const cols = cards.length >= 3 ? "sm:grid-cols-3" : cards.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <SectionHeading heading={d.heading} sub={d.subheading} />
      <div className={`grid grid-cols-1 ${cols} gap-5 mt-8 stagger`}>
        {cards.map((c, i) => (
          <Link key={i} href={c.href || "/products"} className="group relative aspect-[3/4] overflow-hidden lift">
            {c.image && (
              <Image src={c.image} alt={c.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-center">
              <div className="font-display text-2xl text-cream">{c.title}</div>
              {c.subtitle && <div className="text-xs text-cream/70 mt-1">{c.subtitle}</div>}
              <div className="mt-2 inline-block text-xs tracking-[0.25em] text-gold-light uppercase border-b border-gold-light/50 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Rich text ── */
export function RichTextSection({ d }: { d: D }) {
  if (!d.heading && !d.body) return null;
  return (
    <section className={`max-w-3xl mx-auto px-6 py-14 ${d.align === "left" ? "" : "text-center"}`}>
      {d.heading && <h2 className="font-display text-2xl sm:text-4xl">{d.heading}</h2>}
      {d.heading && d.align !== "left" && <div className="gold-divider"><span className="gold-dot" /></div>}
      {d.body && <p className="text-ink/70 leading-relaxed whitespace-pre-line">{d.body}</p>}
    </section>
  );
}
