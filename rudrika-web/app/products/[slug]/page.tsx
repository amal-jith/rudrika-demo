import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR, parseImages } from "@/lib/utils";
import { STORE, waLink } from "@/lib/store-config";
import BuyBox from "@/components/BuyBox";
import WishlistButton from "@/components/WishlistButton";
import ReviewForm from "@/components/ReviewForm";
import ProductCard from "@/components/ProductCard";
import { WhatsAppIcon, StarIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.product.findUnique({ where: { slug: params.slug }, select: { name: true, description: true } });
  return { title: p?.name ?? "Saree", description: p?.description?.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      variants: true,
      reviews: { where: { approved: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product || !product.published) notFound();

  const user = await getUser();
  const [wishlisted, related, photos] = await Promise.all([
    user ? db.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }) : null,
    db.product.findMany({
      where: { published: true, categoryId: product.categoryId, id: { not: product.id } },
      include: { category: true, variants: { select: { stock: true } }, reviews: { where: { approved: true }, select: { rating: true } } },
      take: 4,
    }),
    db.customerPhoto.findMany({ where: { productId: product.id, status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
  ]);

  const images = parseImages(product.images);
  const videos = parseImages(product.videos);
  let colourImages: Record<string, string[]> = {};
  try {
    const parsed = JSON.parse((product as any).colourImages || "{}");
    if (parsed && typeof parsed === "object") colourImages = parsed;
  } catch {}
  const avg = product.reviews.length > 0 ? product.reviews.reduce((n, r) => n + r.rating, 0) / product.reviews.length : 0;
  const alreadyReviewed = user ? product.reviews.some((r) => r.userId === user.id) : false;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://rudrika.in";
  const waText = `Hello Rudrika by Tara, I would like to know more about ${product.name} (${formatINR(product.price)}). ${site}/products/${product.slug}`;
  const tags = (product.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <nav className="text-xs text-ink/50 mb-6 tracking-wide">
        <Link href="/" className="hover:text-clay">Home</Link> / <Link href="/products" className="hover:text-clay">Shop</Link>
        {product.category && <> / <Link href={`/products?category=${product.category.slug}`} className="hover:text-clay">{product.category.name}</Link></>} / <span className="text-ink">{product.name}</span>
      </nav>

      <BuyBox
        product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, compareAt: product.compareAt }}
        dispatchNote={product.preorder ? "Made to order. Dispatch in 3 to 4 weeks." : STORE.shipping.dispatch}
        preorder={product.preorder}
        variants={product.variants.map((v) => ({
          id: v.id, label: v.label, colour: (v as any).colour ?? null,
          // A pre-order piece is sold before it is in stock, so the picker treats it as available.
          stock: product.preorder ? Math.max(v.stock, 50) : v.stock,
          price: v.price,
        }))}
        images={images}
        videos={videos}
        colourImages={colourImages}
        header={
          <>
            {product.category && <div className="text-xs uppercase tracking-[0.25em] text-gold-dark mb-2">{product.category.name}</div>}
            <h1 className="font-display text-2xl sm:text-4xl leading-tight">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {product.reviews.length > 0 && (
                <span className="inline-flex items-center gap-1 text-gold">
                  {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} className="w-4 h-4" filled={n <= Math.round(avg)} />)}
                  <span className="text-ink/40 ml-1">{avg.toFixed(1)} from {product.reviews.length} review{product.reviews.length > 1 ? "s" : ""}</span>
                </span>
              )}
              {product.silkMark && <span className="text-[11px] uppercase tracking-widest border border-gold px-2 py-0.5 text-gold-dark">Silk Mark certified</span>}
              {product.preorder && <span className="text-[11px] uppercase tracking-widest bg-ink text-cream px-2 py-0.5">Pre-order</span>}
              {product.productCode && <span className="text-xs text-ink/40">Code {product.productCode}</span>}
            </div>
          </>
        }
        footer={
          <>
            <div className="mt-4 flex items-center gap-6">
              <WishlistButton productId={product.id} initial={!!wishlisted} loggedIn={!!user} />
              <a href={waLink(waText)} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1da851] hover:underline inline-flex items-center gap-1.5">
                <WhatsAppIcon className="w-4 h-4" /> Ask about this saree
              </a>
            </div>

            <div className="mt-8 border-t border-gold/30 pt-6 text-sm leading-relaxed text-ink/80 whitespace-pre-line">{product.description}</div>

            {product.fabric && (
              <details className="mt-4 border-t border-gold/30 pt-4 group" open>
                <summary className="cursor-pointer text-sm font-medium tracking-wide flex justify-between items-center">Fabric and details <span className="text-gold group-open:rotate-45 transition-transform">+</span></summary>
                <p className="mt-3 text-sm text-ink/70 whitespace-pre-line leading-relaxed">{product.fabric}</p>
              </details>
            )}
            {product.care && (
              <details className="mt-4 border-t border-gold/30 pt-4 group">
                <summary className="cursor-pointer text-sm font-medium tracking-wide flex justify-between items-center">Care <span className="text-gold group-open:rotate-45 transition-transform">+</span></summary>
                <p className="mt-3 text-sm text-ink/70 whitespace-pre-line leading-relaxed">{product.care}</p>
              </details>
            )}
            {product.measurements && (
              <details className="mt-4 border-t border-gold/30 pt-4 group">
                <summary className="cursor-pointer text-sm font-medium tracking-wide flex justify-between items-center">Measurements <span className="text-gold group-open:rotate-45 transition-transform">+</span></summary>
                <div className="mt-3 text-sm text-ink/70 whitespace-pre-line leading-relaxed">{product.measurements}</div>
              </details>
            )}
            <details className="mt-4 border-t border-gold/30 pt-4 group">
              <summary className="cursor-pointer text-sm font-medium tracking-wide flex justify-between items-center">Shipping and returns <span className="text-gold group-open:rotate-45 transition-transform">+</span></summary>
              <div className="mt-3 text-sm text-ink/70 leading-relaxed space-y-1">
                <p>Free shipping on orders above {STORE.shipping.freeAbove}, otherwise {STORE.shipping.perSaree} per saree.</p>
                <p>{product.preorder ? "Made to order, dispatched in 3 to 4 weeks." : `Dispatched in ${STORE.shipping.dispatch}`}, delivered across India in {STORE.shipping.delivery}.</p>
                <p>{STORE.returns} <Link href="/returns" className="underline text-clay">Read the policy</Link></p>
              </div>
            </details>
            {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{tags.map((t) => <Link key={t} href={`/products?q=${encodeURIComponent(t)}`} className="text-[11px] uppercase tracking-wider border border-ink/15 px-2 py-0.5 hover:border-clay hover:text-clay">{t}</Link>)}</div>}
          </>
        }
      />

      {/* Wearing Rudrika: approved customer photos of this saree */}
      <section className="mt-16 sm:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Wearing Rudrika</h2>
            <p className="text-sm text-ink/55 mt-1">Customers in this saree. Share yours and earn a coupon on your next order.</p>
          </div>
          <Link href={user ? "/account/photos" : "/login?next=/account/photos"} className="btn-outline !py-2 !px-4 text-sm">Share your photo</Link>
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-ink/45 border border-dashed border-gold/40 p-6 text-center">Be the first to share a photo in this saree.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((p) => (
              <figure key={p.id} className="bg-sand">
                <img src={p.image} alt={p.caption ?? `${p.user.name} wearing ${product.name}`} className="w-full aspect-[3/4] object-cover" loading="lazy" />
                <figcaption className="text-xs text-ink/55 p-2">{p.user.name.split(" ")[0]}{p.caption ? `: ${p.caption}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 sm:mt-20 max-w-3xl">
        <h2 className="font-display text-2xl sm:text-3xl mb-5">Reviews</h2>
        {product.reviews.length === 0 && <p className="text-ink/50 text-sm mb-6">No reviews yet. Be the first.</p>}
        <div className="space-y-6">
          {product.reviews.map((r) => (
            <div key={r.id} className="border-b border-ink/10 pb-5">
              <div className="text-gold inline-flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} className="w-3.5 h-3.5" filled={n <= r.rating} />)}</div>
              {r.title && <div className="font-medium mt-1">{r.title}</div>}
              <p className="text-sm text-ink/70 mt-1">{r.body}</p>
              <div className="text-xs text-ink/40 mt-2">{r.user.name}, {new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          {user ? (alreadyReviewed ? <p className="text-sm text-ink/50">You have already reviewed this piece.</p> : <ReviewForm productId={product.id} />) : (
            <p className="text-sm text-ink/50"><Link href="/login" className="underline hover:text-clay">Sign in</Link> to write a review.</p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-2xl sm:text-3xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
