import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getStories } from "@/lib/gallery";
import { getUser } from "@/lib/auth";
import { getRudrikaSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wearing Rudrika", description: "Customers in their Rudrika by Tara sarees, and moments from the boutique." };

/** Approved customer photos first, then the editorial stories added from Admin, Gallery. */
export default async function GalleryPage() {
  const [stories, photos, user, s] = await Promise.all([
    getStories(),
    db.customerPhoto.findMany({ where: { status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, take: 60, include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } } }),
    getUser(),
    getRudrikaSettings(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="text-xs text-ink/50 mb-6 tracking-wide"><Link href="/" className="hover:text-clay">Home</Link> / <span className="text-ink">Wearing Rudrika</span></nav>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-5xl leading-tight">Wearing <em className="text-clay not-italic">Rudrika</em></h1>
          <p className="text-ink/60 mt-3 leading-relaxed">Our customers, in their own sarees and their own moments. Share yours and earn a {s.photo_coupon_percent}% coupon on your next order once it is approved.</p>
        </div>
        <Link href={user ? "/account/photos" : "/login?next=/account/photos"} className="btn-primary">Share your photo</Link>
      </header>

      {photos.length === 0 ? (
        <p className="text-sm text-ink/45 border border-dashed border-gold/40 p-8 text-center mb-16">The wall is waiting for its first photo.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-16">
          {photos.map((p) => (
            <figure key={p.id} className="bg-sand">
              <img src={p.image} alt={p.caption ?? `${p.user.name} wearing Rudrika`} className="w-full aspect-[3/4] object-cover" loading="lazy" />
              <figcaption className="text-xs text-ink/60 p-2 leading-snug">
                {p.user.name.split(" ")[0]}{p.caption ? `: ${p.caption}` : ""}
                {p.product && <><br /><Link href={`/products/${p.product.slug}`} className="text-clay hover:underline">{p.product.name}</Link></>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-16">
          {stories.map((st) => (
            <section key={st.id} id={st.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                <h2 className="font-display text-2xl sm:text-3xl">{st.title}</h2>
                {st.subtitle && <span className="text-xs uppercase tracking-[0.2em] text-gold-dark">{st.subtitle}</span>}
              </div>
              {st.story && <p className="max-w-2xl text-ink/65 leading-relaxed mb-6 whitespace-pre-line">{st.story}</p>}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {st.photos.map((src, i) => (
                  <div key={src + i} className={`relative overflow-hidden bg-sand ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[3/4]"}`}>
                    <Image src={src} alt={`${st.title}, photo ${i + 1}`} fill sizes={i === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"} className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
