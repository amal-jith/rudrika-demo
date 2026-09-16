"use client";

import Link from "next/link";
import { useState } from "react";

type Row = {
  id: string;
  title: string;
  typeLabel: string;
  hint: string;
  enabled: boolean;
};

export default function SectionList({
  rows,
  reorder,
  toggle,
}: {
  rows: Row[];
  reorder: (ids: string[]) => Promise<void>;
  toggle: (id: string) => Promise<void>;
}) {
  const [items, setItems] = useState(rows);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const commit = async (next: Row[]) => {
    setItems(next);
    setSaving(true);
    await reorder(next.map((r) => r.id));
    setSaving(false);
  };

  const onDrop = (to: number) => {
    if (dragging === null || dragging === to) {
      setDragging(null);
      setOver(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragging, 1);
    next.splice(to, 0, moved);
    setDragging(null);
    setOver(null);
    commit(next);
  };

  const nudge = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-ink/50">Drag the ⠿ handle to reorder blocks.</p>
        {saving && <span className="text-xs text-clay">Saving order</span>}
      </div>

      <div className="space-y-2">
        {items.map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(i);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDrop={() => onDrop(i)}
            className={`admin-card flex items-center gap-3 transition-all ${
              !s.enabled ? "opacity-55" : ""
            } ${dragging === i ? "opacity-40" : ""} ${
              over === i && dragging !== null && dragging !== i ? "ring-2 ring-gold" : ""
            }`}
          >
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="cursor-grab active:cursor-grabbing text-ink/40 hover:text-clay text-lg leading-none select-none px-1"
                title="Drag to reorder"
              >
                ⠿
              </span>
              <div className="flex flex-col gap-0.5 sm:hidden">
                <button onClick={() => nudge(i, -1)} disabled={i === 0}
                  className="text-[9px] px-1.5 border border-ink/20 disabled:opacity-25">▲</button>
                <button onClick={() => nudge(i, 1)} disabled={i === items.length - 1}
                  className="text-[9px] px-1.5 border border-ink/20 disabled:opacity-25">▼</button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{s.title}</div>
              <div className="text-xs text-ink/50 truncate">{s.typeLabel}{s.hint}</div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className={`hidden sm:inline text-xs px-2 py-1 ${s.enabled ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                {s.enabled ? "Visible" : "Hidden"}
              </span>
              <button
                onClick={async () => {
                  setItems((p) => p.map((r) => (r.id === s.id ? { ...r, enabled: !r.enabled } : r)));
                  await toggle(s.id);
                }}
                className="text-xs underline hover:text-clay"
              >
                {s.enabled ? "Hide" : "Show"}
              </button>
              <Link href={`/admin/homepage/${s.id}`} className="btn-primary !py-1.5 !px-4 text-xs">
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
