import { gstBreakup, money2 } from "@/lib/gst";
import { getRudrikaSettings } from "@/lib/settings";
import { getStore } from "@/lib/settings";
import Logo from "@/components/Logo";

type Item = { name: string; variantLabel?: string | null; sku?: string | null; hsn?: string | null; gstRate?: number | null; price: number; qty: number; preorder?: boolean };
type Order = {
  id: string; number: number; name: string; email: string; phone: string; addressLine: string; city: string; state: string; pincode: string;
  subtotal: number; discount: number; shipping: number; total: number; couponCode?: string | null; paymentMethod: string; paymentStatus: string;
  razorpayPaymentId?: string | null; invoiceNumber?: string | null; invoiceDate?: Date | null; createdAt: Date; pointsRedeemed?: number; pointsValue?: number; membershipDiscount?: number;
  items: Item[];
};

/**
 * GST tax invoice, printable and saveable as PDF from the browser. Prices are
 * GST inclusive; CGST and SGST within the store's state, IGST elsewhere.
 * Used by the admin invoice page and the customer's account.
 */
export default async function GstInvoice({ order, backHref }: { order: Order; backHref: string }) {
  const [s, store] = await Promise.all([getRudrikaSettings(), getStore()]);
  const g = gstBreakup(order.items.map((i) => ({ name: i.name, sku: i.sku, hsn: i.hsn, gstRate: i.gstRate, price: i.price, qty: i.qty })), order.state, s.gst_state);
  const date = new Date(order.invoiceDate ?? order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const deductions = (order.discount ?? 0) + (order.pointsValue ?? 0) + (order.membershipDiscount ?? 0);
  return (
    <div className="invoice-sheet bg-white text-ink mx-auto max-w-[820px] p-8 sm:p-12 text-[13px]">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3 border-b border-ink/10 pb-4">
        <a href={backHref} className="btn-outline !py-2 !px-4 text-sm">Back</a>
        <span className="text-xs text-ink/50">Use your browser's Print, then Save as PDF.</span>
      </div>
      <div className="flex justify-between gap-6 border-b-2 border-ink pb-4 mb-5">
        <div>
          <Logo src={store.logo} className="h-12" />
          <div className="mt-2 leading-relaxed">{s.legal_name}<br />{store.branches[0].address}<br />GSTIN {s.gstin || "to be added"}<br />{store.email}, {store.whatsappDisplay}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl">Tax invoice</div>
          <div className="mt-2 leading-relaxed">Invoice {order.invoiceNumber ?? "pending payment"}<br />Date {date}<br />Order #{order.number}<br />Place of supply: {order.state} ({g.intra ? "intra-state" : "inter-state"})</div>
        </div>
      </div>
      <div className="mb-5"><b>Bill to and ship to</b><br />{order.name}<br />{order.addressLine}, {order.city}, {order.state} {order.pincode}<br />{order.phone}, {order.email}</div>
      <table className="w-full border-collapse mb-4">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider border-b border-ink"><th className="py-2 pr-2">Item</th><th className="py-2 pr-2">HSN</th><th className="py-2 pr-2 text-right">Qty</th><th className="py-2 pr-2 text-right">Rate excl.</th><th className="py-2 pr-2 text-right">GST</th><th className="py-2 pr-2 text-right">Tax</th><th className="py-2 text-right">Amount</th></tr></thead>
        <tbody>
          {g.lines.map((l, i) => (
            <tr key={i} className="border-b border-ink/15 align-top">
              <td className="py-2 pr-2">{l.name}{order.items[i]?.variantLabel ? ` (${order.items[i].variantLabel})` : ""}{order.items[i]?.preorder ? " (pre-order)" : ""}<br /><span className="text-[11px] text-ink/50">SKU {l.sku ?? ""}</span></td>
              <td className="py-2 pr-2">{l.hsn ?? ""}</td><td className="py-2 pr-2 text-right">{l.qty}</td><td className="py-2 pr-2 text-right">{money2(l.taxable / l.qty)}</td><td className="py-2 pr-2 text-right">{l.rate}%</td><td className="py-2 pr-2 text-right">{money2(l.tax)}</td><td className="py-2 text-right">{money2(l.gross)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-72 space-y-1">
        <div className="flex justify-between"><span>Taxable value</span><span>{money2(g.taxable)}</span></div>
        {g.intra ? (<><div className="flex justify-between"><span>CGST</span><span>{money2(g.cgst)}</span></div><div className="flex justify-between"><span>SGST</span><span>{money2(g.sgst)}</span></div></>) : (<div className="flex justify-between"><span>IGST</span><span>{money2(g.igst)}</span></div>)}
        <div className="flex justify-between"><span>Shipping</span><span>{money2(order.shipping)}</span></div>
        {deductions > 0 && <div className="flex justify-between"><span>Discounts{order.couponCode ? ` (${order.couponCode})` : ""}{order.pointsRedeemed ? `, ${order.pointsRedeemed} points` : ""}{order.membershipDiscount ? ", Rudrika Circle" : ""}</span><span>-{money2(deductions)}</span></div>}
        <div className="flex justify-between border-t border-ink pt-2 font-semibold text-base"><span>Total paid</span><span>Rs. {money2(order.total)}</span></div>
      </div>
      <p className="text-[11px] text-ink/60 mt-6">Paid via {order.paymentMethod === "MOCK" ? "test payment" : "Razorpay"}{order.razorpayPaymentId ? ` (${order.razorpayPaymentId})` : ""}. Prices are inclusive of GST. This is a computer-generated invoice and does not require a signature.</p>
    </div>
  );
}
