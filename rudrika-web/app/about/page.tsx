import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getStore } from "@/lib/settings";
import { PAGE_SEEDS } from "@/lib/page-defaults";
import { WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our story" };

const PHOTOS = ["/uploads/campaign/rich-band-about.jpg", "/uploads/campaign/editorial-1.jpg", "/uploads/campaign/editorial-2.jpg", "/uploads/campaign/editorial-3.jpg", "/uploads/campaign/rich-detail-zari.jpg"];

/** The story is edited from Admin, Pages, "about". This page lays those blocks out. */
export default async function AboutPage() {
  const [store, page] = await Promise.all([getStore(), db.page.findUnique({ where: { slug: "about" } }).catch(() => null)]);
  const seed = PAGE_SEEDS.find((p) => p.slug === "about")!;
  let blocks: { heading: string; body: string }[] = seed.blocks;
  if (page?.blocks) { try { const b = JSON.parse(page.blocks); if (Array.isArray(b) && b.length) blocks = b; } catch {} }
  const intro = blocks[0];
  const chapters = blocks.slice(1, 4);
  const promises = blocks.slice(4).filter((b) => !/^visit/i.test(b.heading));
  const wa = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent("Hello Rudrika by Tara, I would love to know more.")}`;

  return (
    <div>
      <section className="relative bg-ink text-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="text-xs uppercase tracking-[0.35em] text-gold-light mb-5">{page?.title ?? seed.title}</div>
            <h1 className="font-display text-4xl sm:text-6xl leading-[1.1]">Handcrafted sarees,<br /><em className="text-gold-light">designed for your story.</em></h1>
            <p className="mt-7 text-cream/70 leading-relaxed max-w-md">{intro?.body}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="relative aspect-[3/4] mt-10 bg-sand"><Image src={PHOTOS[1]} alt="Rudrika by Tara campaign" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover object-top" priority /></div>
            <div className="relative aspect-[3/4] mb-10 bg-sand"><Image src={PHOTOS[2]} alt="Rudrika by Tara saree detail" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover object-top" /></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 space-y-16 sm:space-y-24">
        {chapters.map((c, i) => (
          <div key={c.heading} className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 ? "lg:[direction:rtl]" : ""}`}>
            <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-sand"><Image src={PHOTOS[(i + 3) % PHOTOS.length]} alt={c.heading} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
            <div className="lg:[direction:ltr]">
              <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Chapter {i + 1}</div>
              <h2 className="font-display text-3xl sm:text-4xl leading-tight">{c.heading}</h2>
              <p className="mt-4 text-ink/70 leading-relaxed whitespace-pre-line">{c.body}</p>
            </div>
          </div>
        ))}
      </section>

      {promises.length > 0 && (
        <section className="bg-ink text-cream">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="font-display text-3xl sm:text-4xl text-center">What we promise you</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 stagger">
              {promises.map((p) => <div key={p.heading} className="border-l border-gold/40 pl-5"><div className="font-display text-xl text-gold-light">{p.heading}</div><p className="text-sm text-cream/60 mt-2 leading-relaxed">{p.body}</p></div>)}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl text-center">Visit the boutique</h2>
        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          {store.branches.map((b) => (
            <div key={b.name} className="bg-white border border-gold/20 p-7">
              <div className="font-display text-2xl">{b.name}</div>
              <p className="text-sm text-ink/65 mt-3 leading-relaxed">{b.address}</p>
              <p className="text-sm mt-3"><a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-clay underline">{b.phone}</a></p>
              <a href={b.map} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !px-4 text-xs mt-4">Get directions</a>
            </div>
          ))}
          <div className="relative aspect-[4/3] sm:aspect-auto bg-sand"><Image src={PHOTOS[0]} alt="Rudrika by Tara" fill sizes="50vw" className="object-cover" /></div>
        </div>
        {store.hours && <p className="text-center text-sm text-ink/50 mt-6">{store.hours}</p>}
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="font-display text-3xl sm:text-5xl leading-tight">Find the saree that <em className="text-clay">tells your story.</em></h2>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/products" className="btn-primary">Shop sarees</Link>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-2"><WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp</a>
        </div>
      </section>
    </div>
  );
}
