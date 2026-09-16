import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatINR } from "@/lib/utils";
import { gstBreakup } from "@/lib/gst";
import { getRudrikaSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "GST invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  await guardPage("invoices");
  const s = await getRudrikaSettings();
  const where: any = { paymentStatus: "PAID" };
  if (searchParams.from) where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(searchParams.from) };
  if (searchParams.to) where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(searchParams.to + "T23:59:59") };
  const orders = await db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" }, take: 500 });
  const rows = orders.map((o) => ({ o, g: gstBreakup(o.items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, gstRate: i.gstRate, hsn: i.hsn, sku: i.sku })), o.state, s.gst_state) }));
  const sum = (k: "taxable" | "cgst" | "sgst" | "igst") => rows.reduce((n, r) => n + r.g[k], 0);
  const qs = new URLSearchParams({ ...(searchParams.from ? { from: searchParams.from } : {}), ...(searchParams.to ? { to: searchParams.to } : {}) }).toString();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">GST invoices</h1>
          <p className="text-sm text-ink/60">One invoice per paid order, numbered {s.invoice_prefix}0001 onwards. GSTIN {s.gstin || "not set yet (Settings)"}.</p>
        </div>
        <form className="flex items-end gap-2">
          <div><label className="label">From</label><input type="date" name="from" defaultValue={searchParams.from} className="input !py-2" /></div>
          <div><label className="label">To</label><input type="date" name="to" defaultValue={searchParams.to} className="input !py-2" /></div>
          <button className="btn-outline !py-2.5">Filter</button>
          <a className="btn-primary !py-2.5" href={`/api/admin/gst-report?${qs}`} download>GST report CSV</a>
        </form>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 mb-6 text-sm">
        {[["Taxable value", sum("taxable")], ["CGST", sum("cgst")], ["SGST", sum("sgst")], ["IGST", sum("igst")]].map(([l, v]) => (
          <div key={l as string} className="admin-card"><div className="text-xs uppercase tracking-widest text-ink/50">{l as string}</div><div className="font-display text-2xl mt-1">{formatINR(v as number)}</div></div>
        ))}
      </div>
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
            <th className="p-3">Invoice</th><th className="p-3">Date</th><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">State</th><th className="p-3 text-right">Taxable</th><th className="p-3 text-right">Tax</th><th className="p-3 text-right">Total</th><th className="p-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-ink/5">
            {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-ink/50">No paid orders in this range.</td></tr>}
            {rows.map(({ o, g }) => (
              <tr key={o.id}>
                <td className="p-3 font-mono text-xs">{o.invoiceNumber ?? "pending"}</td>
                <td className="p-3">{new Date(o.invoiceDate ?? o.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">#{o.number}</td><td className="p-3">{o.name}</td><td className="p-3">{o.state}{g.intra ? "" : " (IGST)"}</td>
                <td className="p-3 text-right">{formatINR(g.taxable)}</td><td className="p-3 text-right">{formatINR(g.tax)}</td><td className="p-3 text-right font-medium">{formatINR(o.total)}</td>
                <td className="p-3"><Link className="underline" href={`/admin/orders/${o.id}/invoice`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
