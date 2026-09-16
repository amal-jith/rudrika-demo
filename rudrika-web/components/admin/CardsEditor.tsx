"use client";

import { useState } from "react";
import type { Card } from "@/lib/section-types";

export default function CardsEditor({
  initial,
  subtitleLabel = "Second line",
  max = 6,
}: {
  initial: Card[];
  subtitleLabel?: string;
  max?: number;
}) {
  const [cards, setCards] = useState<Card[]>(initial.length ? initial : [{}]);
  const [busy, setBusy] = useState<number | null>(null);

  const set = (i: number, k: keyof Card, v: string) =>
    setCards((p) => p.map((c, j) => (j === i ? { ...c, [k]: v } : c)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    setCards(next);
  };

  const upload = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(i);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      set(i, "image", url);
    } else alert("Upload failed");
    setBusy(null);
    e.target.value = "";
  };

  return (
    <div>
      <input type="hidden" name="cards" value={JSON.stringify(cards.filter((c) => c.title || c.subtitle))} />
      <div className="flex justify-between items-center mb-2">
        <span className="label !mb-0">Cards ({cards.length})</span>
        {cards.length < max && (
          <button type="button" className="text-sm underline hover:text-clay" onClick={() => setCards([...cards, {}])}>
            + Add card
          </button>
        )}
      </div>

      <div className="space-y-3">
        {cards.map((c, i) => (
          <div key={i} className="border border-gold/30 bg-white p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase tracking-widest text-gold-dark">Card {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="text-xs px-2 py-1 border border-ink/20 disabled:opacity-25 hover:bg-sand">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === cards.length - 1}
                  className="text-xs px-2 py-1 border border-ink/20 disabled:opacity-25 hover:bg-sand">▼</button>
                <button
                  type="button"
                  onClick={() => setCards(cards.filter((_, j) => j !== i))}
                  className="text-xs px-2.5 py-1 border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-24 shrink-0">
                <div className="w-24 h-20 bg-sand border border-ink/10 overflow-hidden flex items-center justify-center">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-ink/40">No photo</span>
                  )}
                </div>
                <label className="btn-outline !py-1.5 !px-2 !text-[11px] cursor-pointer mt-2 w-full text-center block">
                  {busy === i ? "Wait" : "Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(i, e)} disabled={busy === i} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input className="input !py-2" placeholder="Title (e.g. Everyday Elegance)"
                  value={c.title ?? ""} onChange={(e) => set(i, "title", e.target.value)} />
                <input className="input !py-2" placeholder={subtitleLabel}
                  value={c.subtitle ?? ""} onChange={(e) => set(i, "subtitle", e.target.value)} />
                <input className="input !py-2 text-xs" placeholder="Link (e.g. /products?max=3000)"
                  value={c.href ?? ""} onChange={(e) => set(i, "href", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink/40 mt-2">
        Deleting a card removes it completely, the remaining cards spread out to fill the row.
      </p>
    </div>
  );
}
