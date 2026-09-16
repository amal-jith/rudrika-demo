"use client";

import Link from "next/link";
import { useState } from "react";
import { formatINR, ORDER_STATUSES } from "@/lib/utils";
import { bulkUpdateOrderStatus } from "@/lib/admin-actions";

export type OrderRow = {
  id: string;
  number: number;
  name: string;
  email: string;
  createdAt: string;
  itemCount: number;
  total: number;
  paymentStatus: string;
  status: string;
};

/**
 * The orders list, with tick boxes so a morning's dispatch is one action
 * instead of twenty.
 *
 * The only genuinely dangerous thing here is marking a batch SHIPPED: that
 * sends a WhatsApp to every customer in the selection. So the confirm box
 * counts them out loud rather than saying "Are you sure?", which nobody reads.
 */
export default function OrdersTable({
  orders,
  showMoney = true,
}: {
  orders: OrderRow[];
  /** Dispatch accounts pack boxes; they don't need order totals. */
  showMoney?: boolean;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>("SHIPPED");

  const allOn = orders.length > 0 && sel.size === orders.length;

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => setSel(allOn ? new Set() : new Set(orders.map((o) => o.id)));

  const confirmBulk = (e: React.FormEvent<HTMLFormElement>) => {
    const picked = orders.filter((o) => sel.has(o.id));
    let msg = `Move ${picked.length} order${picked.length === 1 ? "" : "s"} to ${status}?`;

    if (status === "SHIPPED") {
      const willMessage = picked.filter((o) => o.status !== "SHIPPED").length;
      if (willMessage > 0) {
        msg += `\n\nThis sends a WhatsApp to ${willMessage} customer${
          willMessage === 1 ? "" : "s"
        }. That can't be undone.`;
      }
    }
    if (!window.confirm(msg)) e.preventDefault();
  };

  const cols = showMoney ? 9 : 8;

  return (
    <>
      {sel.size > 0 && (
        <form
          action={bulkUpdateOrderStatus}
          onSubmit={confirmBulk}
          className="admin-card mb-4 flex items-center gap-3 flex-wrap sticky top-2 z-10 border-clay/40"
        >
          <input type="hidden" name="ids" value={Array.from(sel).join(",")} />
          <span className="text-sm font-medium">
            {sel.size} selected
          </span>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input !py-2 !w-auto"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                Mark as {s}
              </option>
            ))}
          </select>
          <button className="btn-primary !py-2 !px-5 text-sm">Apply</button>
          <button
            type="button"
            onClick={() => setSel(new Set())}
            className="text-sm text-ink/50 underline hover:text-clay"
          >
            Clear
          </button>
          {status === "SHIPPED" && (
            <span className="text-xs text-clay w-full">
              Marking as SHIPPED messages each customer on WhatsApp.
            </span>
          )}
        </form>
      )}

      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allOn}
                  onChange={toggleAll}
                  aria-label="Select all orders"
                  className="w-4 h-4 accent-[#8a4b38] align-middle"
                />
              </th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Items</th>
              {showMoney && <th className="p-3">Total</th>}
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {orders.length === 0 && (
              <tr>
                <td colSpan={cols} className="p-6 text-center text-ink/50">
                  No orders.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className={sel.has(o.id) ? "bg-sand" : "hover:bg-sand/50"}>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={sel.has(o.id)}
                    onChange={() => toggle(o.id)}
                    aria-label={`Select order ${o.number}`}
                    className="w-4 h-4 accent-[#8a4b38] align-middle"
                  />
                </td>
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-clay">
                    #{o.number}
                  </Link>
                </td>
                <td className="p-3">
                  {o.name}
                  <div className="text-xs text-ink/40">{o.email}</div>
                </td>
                <td className="p-3 text-ink/60">
                  {new Date(o.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="p-3">{o.itemCount}</td>
                {showMoney && <td className="p-3 font-medium">{formatINR(o.total)}</td>}
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 ${
                      o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-ink/10"
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/orders/${o.id}/invoice`}
                    className="text-xs underline hover:text-clay"
                  >
                    Print
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
