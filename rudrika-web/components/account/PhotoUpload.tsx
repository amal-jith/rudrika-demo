"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Customer uploads a wearing photo; admin approves it and the 2% coupon is issued. */
export default function PhotoUpload({ products, percent }: { products: { id: string; name: string }[]; percent: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!(fd.get("file") as File)?.size) return setMsg("Choose a photo first.");
    if (!fd.get("consent")) return setMsg("Please tick the consent box so we can show your photo.");
    setBusy(true); setMsg(null);
    const r = await fetch("/api/photos", { method: "POST", body: fd });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Upload failed");
    form.reset();
    setMsg(`Thank you. Your photo is with us for review. Once approved you get a ${percent}% coupon on WhatsApp and here.`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gold/20 p-5 space-y-3 text-sm">
      <h3 className="font-display text-2xl">Share a photo in your Rudrika saree</h3>
      <p className="text-ink/60">Approved photos appear on the product page and on the Wearing Rudrika wall. Each approved photo earns a one-time {percent}% coupon for your next order.</p>
      <input type="file" name="file" accept="image/*" required className="block w-full text-sm" />
      <select name="productId" className="input w-full"><option value="">Which saree is this? (optional)</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input name="caption" placeholder="A line about the occasion (optional)" maxLength={140} className="input w-full" />
      <label className="flex gap-2 items-start"><input type="checkbox" name="consent" value="1" className="mt-1" /><span>I own this photo and allow Rudrika by Tara to show it on rudrika.in and its social pages.</span></label>
      <button disabled={busy} className="btn-primary">{busy ? "Uploading" : "Send for review"}</button>
      {msg && <p className="text-clay">{msg}</p>}
    </form>
  );
}
