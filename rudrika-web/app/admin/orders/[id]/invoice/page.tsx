import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import GstInvoice from "@/components/GstInvoice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: { id: string } }) {
  await guardPage("orders");
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) notFound();
  return <GstInvoice order={order} backHref={`/admin/orders/${order.id}`} />;
}
