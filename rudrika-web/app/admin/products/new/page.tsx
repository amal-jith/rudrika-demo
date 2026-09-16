import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  await guardPage("products");
  const categories = await db.category.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">New Product</h1>
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
