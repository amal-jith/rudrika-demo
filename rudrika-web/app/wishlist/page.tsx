import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const wishlist = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-10">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-16 text-ink/50">
          Nothing saved yet.{" "}
          <Link href="/products" className="underline hover:text-clay">Explore the collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((w) => (
            <ProductCard key={w.productId} product={w.product} />
          ))}
        </div>
      )}
    </div>
  );
}
