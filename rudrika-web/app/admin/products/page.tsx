import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatINR, parseImages } from "@/lib/utils";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: { saved?: string } }) {
  await guardPage("products");
  const products = await db.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ New Product</Link>
      </div>
      {searchParams.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-5 text-sm">
          Product saved.
        </div>
      )}
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
              <th className="p-3"></th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stock, 0);
              const img = parseImages(p.images)[0];
              return (
                <tr key={p.id} className="hover:bg-sand/50">
                  <td className="p-2 w-14">
                    <div className="relative w-10 h-12 bg-sand">
                      {img && <Image src={img} alt="" fill className="object-contain" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-clay">
                      {p.name}
                    </Link>
                    {p.featured && <span className="ml-2 text-xs bg-gold/20 text-gold px-1.5 py-0.5">Featured</span>}
                  </td>
                  <td className="p-3 text-ink/60">{p.category?.name ?? "-"}</td>
                  <td className="p-3">{formatINR(p.price)}</td>
                  <td className={`p-3 ${stock === 0 ? "text-red-600" : stock <= 5 ? "text-clay" : ""}`}>{stock}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 ${p.published ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                      {p.published ? "Live" : "Draft"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
