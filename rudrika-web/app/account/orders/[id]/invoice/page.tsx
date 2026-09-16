import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import GstInvoice from "@/components/GstInvoice";

export const dynamic = "force-dynamic";
export const metadata = { title: "GST invoice" };

export default async function CustomerInvoice({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order || order.userId !== user.id) notFound();
  return <GstInvoice order={order} backHref="/account/orders" />;
}
