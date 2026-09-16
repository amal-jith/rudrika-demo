import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatINR, parseImages } from "@/lib/utils";
import Media from "@/components/Media";
import { removeFromWishlist } from "@/lib/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Wishlist" };

export default async function AccountWishlist() {
  const user = await getUser();
  // The layout redirects too, but in the App Router layouts and pages render
  // in parallel, so each page has to guard on its own or it throws first.
  if (!user) redirect("/login");
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true, variants: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!items.length)
    return (
      <div className="bg-white border border-gold/20 p-10 text-center">
        <p className="text-ink/55 text-sm">Nothing saved yet. Tap the heart on any product to keep it here.</p>
        <Link href="/products" className="btn-primary mt-5">Explore the Collection</Link>
      </div>
    );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((w) => {
        const img = parseImages(w.product.images)[0];
        const stock = w.product.variants.reduce((n, v) => n + v.stock, 0);
        return (
          <div key={w.productId} className="bg-white border border-gold/20">
            <Link href={`/products/${w.product.slug}`}>
              <Media src={img} alt={w.product.name} ratio="aspect-[3/4]" sizes="(max-width:640px) 50vw, 25vw" />
            </Link>
            <div className="p-4">
              <Link href={`/products/${w.product.slug}`} className="font-display text-base leading-snug hover:text-clay line-clamp-2">
                {w.product.name}
              </Link>
              <div className="text-sm mt-1">{formatINR(w.product.price)}</div>
              <div className={`text-[11px] mt-1 ${stock ? "text-green-700" : "text-red-600"}`}>
                {stock ? "In stock" : "Out of stock"}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Link href={`/products/${w.product.slug}`} className="btn-primary !py-1.5 !px-3 text-xs">View</Link>
                <form action={removeFromWishlist}>
                  <input type="hidden" name="productId" value={w.productId} />
                  <button className="text-xs underline text-ink/50 hover:text-red-600">Remove</button>
                </form>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
