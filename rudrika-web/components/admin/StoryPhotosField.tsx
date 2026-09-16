"use client";

import { useState } from "react";
import { uploadImages, type UploadProgress } from "@/lib/upload-client";

/**
 * Multi-photo picker for one gallery story.
 *
 * Uploads go straight to /api/admin/upload; the resulting list of URLs is kept
 * in a hidden input as JSON so the surrounding server-action form posts it.
 * Photos can be reordered, the first one leads the story.
 */
export default function StoryPhotosField({
  name,
  defaultValue = [],
}: {
  name: string;
  defaultValue?: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [paste, setPaste] = useState("");
  /** The paste-a-link box is a fallback, hidden until asked for. */
  const [showLink, setShowLink] = useState(false);

  const uploadMany = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const { urls, errors } = await uploadImages(files, setProgress);
    if (urls.length) setPhotos((p) => [...p, ...urls]);
    if (errors.length) alert(errors.join("\n"));
    setBusy(false);
    setProgress(null);
    e.target.value = "";
  };

  const move = (from: number, to: number) =>
    setPhotos((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });

  const addPasted = () => {
    const urls = paste
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length) setPhotos((p) => [...p, ...urls]);
    setPaste("");
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(photos)} />

      {/* Upload is the primary action and looks like it. The link box below is
          a fallback that used to sit here competing for attention. */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="btn-primary !py-2.5 !px-5 cursor-pointer text-sm inline-block">
          {busy
            ? progress
              ? `Uploading ${progress.done} of ${progress.total}`
              : "Uploading"
            : photos.length
            ? "＋ Add more photos"
            : "＋ Add photos from your computer"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={uploadMany}
            disabled={busy}
          />
        </label>
        <span className="text-xs text-ink/50">
          {photos.length
            ? `${photos.length} photo${photos.length === 1 ? "" : "s"}, the first one leads the story`
            : "You can pick several at once"}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {photos.map((src, i) => (
            <div key={src + i} className="relative group border border-ink/10 bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  className="text-cream text-xs px-2 py-1"
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, n) => n !== i))}
                  className="text-cream text-xs px-2 py-1 hover:text-red-300"
                  aria-label="Remove"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  className="text-cream text-xs px-2 py-1"
                  aria-label="Move later"
                >
                  Move
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-gold text-ink text-[9px] px-1.5 py-0.5 uppercase tracking-wider">
                  First
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showLink ? (
        <div className="flex gap-2">
          <input
            className="input !py-1.5 text-xs flex-1"
            placeholder="Paste image links, separated by spaces or commas"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPasted();
              }
            }}
          />
          <button type="button" onClick={addPasted} className="btn-outline !py-1.5 !px-3 text-xs">
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLink(true)}
          className="text-xs underline text-ink/40 hover:text-clay"
        >
          or paste an image link instead
        </button>
      )}
    </div>
  );
}
