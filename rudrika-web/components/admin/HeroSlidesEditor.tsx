"use client";

import { useState } from "react";
import type { Slide } from "@/lib/section-types";

export default function HeroSlidesEditor({ initial }: { initial: Slide[] }) {
  const [slides, setSlides] = useState<Slide[]>(initial.length ? initial : [{}]);
  const [busy, setBusy] = useState<number | null>(null);

  const set = (i: number, k: keyof Slide, v: string) =>
    setSlides((p) => p.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
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
      <input type="hidden" name="slides" value={JSON.stringify(slides)} />
      <div className="flex justify-between items-center mb-2">
        <span className="label !mb-0">Slides ({slides.length})</span>
        {slides.length < 5 && (
          <button type="button" className="text-sm underline hover:text-clay" onClick={() => setSlides([...slides, {}])}>
            + Add slide
          </button>
        )}
      </div>

      <div className="space-y-4">
        {slides.map((s, i) => (
          <div key={i} className="border border-gold/30 bg-white p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase tracking-widest text-gold-dark">Slide {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs px-2 py-1 border border-ink/20 disabled:opacity-25">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="text-xs px-2 py-1 border border-ink/20 disabled:opacity-25">▼</button>
                <button type="button" onClick={() => setSlides(slides.filter((_, j) => j !== i))} disabled={slides.length === 1} className="text-xs px-2 py-1 border border-ink/20 text-red-600 disabled:opacity-25">✕</button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-24 shrink-0">
                <div className="w-24 h-32 bg-sand border border-ink/10 overflow-hidden flex items-center justify-center">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-ink/40">No photo</span>
                  )}
                </div>
                <label className="btn-outline !py-1.5 !px-2 !text-[11px] cursor-pointer mt-2 w-full text-center block">
                  {busy === i ? "Wait" : "Choose photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(i, e)} disabled={busy === i} />
                </label>
              </div>

              <div className="flex-1 space-y-2">
                <input className="input !py-2 text-xs" placeholder="Small label (e.g. Crafted for Celebrations)"
                  value={s.eyebrow ?? ""} onChange={(e) => set(i, "eyebrow", e.target.value)} />
                <input className="input !py-2" placeholder="Heading line 1"
                  value={s.title ?? ""} onChange={(e) => set(i, "title", e.target.value)} />
                <input className="input !py-2" placeholder="Heading line 2 (gold italic)"
                  value={s.titleEm ?? ""} onChange={(e) => set(i, "titleEm", e.target.value)} />
                <textarea className="input !py-2 text-sm" rows={2} placeholder="Paragraph"
                  value={s.subtitle ?? ""} onChange={(e) => set(i, "subtitle", e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input !py-2 text-xs" placeholder="Button text"
                    value={s.ctaLabel ?? ""} onChange={(e) => set(i, "ctaLabel", e.target.value)} />
                  <input className="input !py-2 text-xs" placeholder="Button link (/products or whatsapp)"
                    value={s.ctaHref ?? ""} onChange={(e) => set(i, "ctaHref", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink/40 mt-2">
        Photos look best at 1200 x 1600 px (portrait 3:4). Slides change automatically.
      </p>
    </div>
  );
}
