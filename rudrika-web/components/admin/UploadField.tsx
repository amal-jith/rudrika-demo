"use client";

import { useState } from "react";
import { shrinkImage } from "@/lib/upload-client";

/**
 * Simple, non-technical file picker.
 * Shows a preview + "Choose file" button; the URL is stored in a hidden input
 * so it still posts with the surrounding <form>.
 */
export default function UploadField({
  name,
  defaultValue = "",
  kind = "image",
  label,
}: {
  name: string;
  defaultValue?: string;
  kind?: "image" | "video";
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const accept = kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*";

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setBusy(true);
    // Videos go up untouched; photos are shrunk first so a 20MB original
    // doesn't have to cross the wire.
    const file = kind === "video" ? picked : await shrinkImage(picked);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setValue(url);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Upload failed");
    }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input type="hidden" name={name} value={value} />
      <div className="flex items-start gap-3">
        <div className="w-20 h-24 bg-sand border border-ink/10 shrink-0 flex items-center justify-center overflow-hidden">
          {value ? (
            kind === "video" ? (
              <video src={value} preload="metadata" className="w-full h-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="w-full h-full object-contain" />
            )
          ) : (
            <span className="text-[10px] text-ink/40 text-center px-1">No {kind}</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="btn-outline !py-2 !px-4 cursor-pointer text-sm inline-block">
            {busy ? "Uploading" : value ? `Replace ${kind}` : `Choose ${kind}`}
            <input type="file" accept={accept} className="hidden" onChange={upload} disabled={busy} />
          </label>
          {value && (
            <button type="button" onClick={() => setValue("")} className="text-xs underline text-ink/50 hover:text-red-600 ml-3">
              Remove
            </button>
          )}
          <input
            className="input !py-1.5 text-xs"
            placeholder="or paste a link"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
