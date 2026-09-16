"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { productId: string; product: string; variant: string; sku: string; mrp: number };

declare global { interface Window { JsBarcode?: any } }

/**
 * Printable SKU labels. Pick sarees and a quantity per variant, then print an
 * A4 sheet (three across) or 50 x 30 mm thermal labels. Barcodes are Code 128
 * of the SKU, drawn client-side by JsBarcode.
 */
export default function LabelSheet({ rows }: { rows: Row[] }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [layout, setLayout] = useState<"a4" | "thermal">("a4");
  const [q, setQ] = useState("");
  const chosen = useMemo(() => rows.flatMap((r) => Array.from({ length: qty[r.sku] ?? 0 }, () => r)), [rows, qty]);
  const filtered = rows.filter((r) => !q || `${r.product} ${r.variant} ${r.sku}`.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!chosen.length) return;
    const draw = () => document.querySelectorAll<SVGSVGElement>("svg[data-sku]").forEach((el) => {
      try { window.JsBarcode?.(el, el.dataset.sku, { format: "CODE128", displayValue: false, height: 34, width: 1.4, margin: 0 }); } catch {}
    });
    if (window.JsBarcode) return draw();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js";
    s.onload = draw;
    document.body.appendChild(s);
  }, [chosen]);

  const money = (p: number) => "Rs. " + Math.round(p / 100).toLocaleString("en-IN");

  return (
    <div>
      <div className="no-print admin-card mb-6">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]"><label className="label">Find a saree or SKU</label><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Silk, RUD-SLK-0001, Blue" /></div>
          <div><label className="label">Layout</label>
            <select className="input" value={layout} onChange={(e) => setLayout(e.target.value as any)}>
              <option value="a4">A4 sheet, 3 across</option>
              <option value="thermal">Thermal 50 x 30 mm</option>
            </select></div>
          <button className="btn-primary !py-2.5" onClick={() => window.print()} disabled={!chosen.length}>Print {chosen.length} label{chosen.length === 1 ? "" : "s"}</button>
          <button className="btn-outline !py-2.5" onClick={() => setQty({})}>Clear</button>
        </div>
        <div className="max-h-[420px] overflow-auto border border-gold/20">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-sand"><tr className="text-left text-xs uppercase tracking-widest text-ink/50"><th className="p-2">Saree</th><th className="p-2">Variant</th><th className="p-2">SKU</th><th className="p-2">MRP</th><th className="p-2">Labels</th></tr></thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((r) => (
                <tr key={r.sku}>
                  <td className="p-2">{r.product}</td><td className="p-2">{r.variant}</td><td className="p-2 font-mono text-xs">{r.sku}</td><td className="p-2">{money(r.mrp)}</td>
                  <td className="p-2"><input type="number" min={0} max={200} className="input !py-1 w-20" value={qty[r.sku] ?? 0} onChange={(e) => setQty({ ...qty, [r.sku]: Math.max(0, Math.round(Number(e.target.value) || 0)) })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .labels-a4{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .labels-thermal .lbl{width:50mm;height:30mm;page-break-after:always;padding:2mm 3mm}
        .lbl{border:1px solid #bbb;background:#fff;padding:8px 10px;font-size:11px;line-height:1.3;break-inside:avoid;color:#111}
        .lbl .n{font-weight:600;font-size:12px}.lbl .v{color:#444}.lbl svg{width:100%;height:36px;margin-top:4px}.lbl .sku{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.04em}.lbl .mrp{font-weight:700;font-size:12px;margin-top:2px}
        @media print{.no-print,header,nav,aside,footer{display:none!important}body{background:#fff}.labels-a4{gap:4mm}.lbl{border-color:#ddd}}
      `}</style>
      <div className={layout === "a4" ? "labels-a4" : "labels-thermal"}>
        {chosen.map((r, i) => (
          <div className="lbl" key={i}>
            <div className="n">{r.product}</div>
            <div className="v">{r.variant}</div>
            <svg data-sku={r.sku} />
            <div className="sku">{r.sku}</div>
            <div className="mrp">MRP {money(r.mrp)} incl. GST</div>
          </div>
        ))}
        {!chosen.length && <p className="no-print text-sm text-ink/50">Choose a quantity next to any variant above; the labels appear here and print with the button.</p>}
      </div>
    </div>
  );
}
