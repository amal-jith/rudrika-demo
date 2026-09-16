"use client";

import { useState } from "react";

type Block = { heading: string; body: string };

export default function PageBlocksEditor({ initial }: { initial: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(initial.length ? initial : [{ heading: "", body: "" }]);

  const set = (i: number, k: keyof Block, v: string) =>
    setBlocks((prev) => prev.map((b, j) => (j === i ? { ...b, [k]: v } : b)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  return (
    <div>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks.filter((b) => b.heading || b.body))} />
      <div className="flex justify-between items-center mb-2">
        <span className="label !mb-0">Content blocks</span>
        <button type="button" className="text-sm underline hover:text-clay" onClick={() => setBlocks([...blocks, { heading: "", body: "" }])}>
          + Add block
        </button>
      </div>

      <div className="space-y-4">
        {blocks.map((b, i) => (
          <div key={i} className="border border-ink/10 p-4 bg-white">
            <div className="flex gap-2 items-center mb-2">
              <input
                className="input !py-2 font-medium"
                placeholder="Block heading (e.g. Our Story)"
                value={b.heading}
                onChange={(e) => set(i, "heading", e.target.value)}
              />
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs px-2 py-1.5 border border-ink/20 disabled:opacity-25">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="text-xs px-2 py-1.5 border border-ink/20 disabled:opacity-25">▼</button>
              <button type="button" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="text-ink/40 hover:text-red-600 px-1 text-xs">Remove</button>
            </div>
            <textarea
              className="input text-sm"
              rows={5}
              placeholder="Write the text for this block"
              value={b.body}
              onChange={(e) => set(i, "body", e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
