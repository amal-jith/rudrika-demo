import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import LabelSheet from "@/components/admin/LabelSheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "SKU labels" };

export default async function LabelsPage() {
  await guardPage("labels");
  const products = await db.product.findMany({ where: { published: true }, include: { variants: true }, orderBy: { productCode: "asc" } });
  const rows = products.flatMap((p) => p.variants.map((v) => ({
    productId: p.id, product: p.name, variant: [v.colour, v.label].filter(Boolean).join(", ") || "Free Size", sku: v.sku ?? `${p.productCode ?? "RUD"}-00`, mrp: v.price ?? p.price,
  })));
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">SKU labels</h1>
      <p className="text-sm text-ink/60 mb-6">Every product and variant carries a unique SKU generated automatically. Print labels with a Code 128 barcode, the saree name, the variant, the SKU and the MRP including GST. <a className="underline" href="/api/admin/products/export">Download the products CSV with SKUs</a>.</p>
      <LabelSheet rows={rows} />
    </div>
  );
}
