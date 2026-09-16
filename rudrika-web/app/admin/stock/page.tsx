import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { getLowStockThreshold } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Everything that's run out or is about to.
 *
 * Split in two on purpose. Sold out is money already being turned away, every
 * customer who picks that size today gets a dead end. Running low is a warning
 * you can still act on. Lumping them together buries the urgent ones.
 */
export default async function AdminStock() {
  await guardPage("stock");

  const threshold = await getLowStockThreshold();

  const rows = await db.variant.findMany({
    where: { stock: { lte: threshold } },
    include: { product: { select: { id: true, name: true, published: true } } },
    orderBy: [{ stock: "asc" }],
  });

  const out = rows.filter((v) => v.stock === 0);
  const low = rows.filter((v) => v.stock > 0);

  const Table = ({ items }: { items: typeof rows }) => (
    <div className="admin-card !p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
            <th className="p-3">Product</th>
            <th className="p-3">Colour</th>
            <th className="p-3">Size</th>
            <th className="p-3">Left</th>
            <th className="p-3 text-right">Fix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {items.map((v) => (
            <tr key={v.id} className="hover:bg-sand/50">
              <td className="p-3">
                {v.product.name}
                {!v.product.published && (
                  <span className="text-xs bg-ink/10 px-2 py-0.5 ml-2">Hidden</span>
                )}
              </td>
              <td className="p-3 text-ink/60">{v.colour ?? "-"}</td>
              <td className="p-3">{v.label}</td>
              <td className="p-3">
                <span className={v.stock === 0 ? "text-red-600 font-medium" : "text-clay font-medium"}>
                  {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                </span>
              </td>
              <td className="p-3 text-right">
                <Link
                  href={`/admin/products/${v.product.id}`}
                  className="text-xs underline hover:text-clay whitespace-nowrap"
                >
                  Update stock
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-display text-3xl">Stock</h1>
        <Link href="/admin/settings" className="text-sm underline hover:text-clay">
          Change the {threshold} threshold
        </Link>
      </div>
      <p className="text-sm text-ink/60 mb-8">
        Anything with {threshold} or fewer left. Stock is counted per colour and size, so a piece can
        be fine in green and gone in rust.
      </p>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">
          Sold out <span className="text-ink/40 text-base">({out.length})</span>
        </h2>
        {out.length === 0 ? (
          <div className="admin-card text-sm text-ink/50">Nothing is sold out. Good place to be.</div>
        ) : (
          <>
            <p className="text-sm text-ink/60 mb-3">
              Customers picking these sizes right now can&apos;t buy. Restock, or hide the product.
            </p>
            <Table items={out} />
          </>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">
          Running low <span className="text-ink/40 text-base">({low.length})</span>
        </h2>
        {low.length === 0 ? (
          <div className="admin-card text-sm text-ink/50">Nothing running low.</div>
        ) : (
          <Table items={low} />
        )}
      </section>
    </div>
  );
}
