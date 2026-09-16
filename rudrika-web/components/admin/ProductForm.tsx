"use client";

import { useState } from "react";
import { saveProduct, deleteProduct } from "@/lib/admin-actions";
import { uploadImages, type UploadProgress } from "@/lib/upload-client";

type VariantRow = { id?: string; label: string; colour: string; sku: string; price: string; stock: number };
type Cat = { id: string; name: string };

export default function ProductForm({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAt: number | null;
    images: string[];
    videos: string[];
    measurements: string | null;
    fabric: string | null;
    categoryId: string | null;
    featured: boolean;
    published: boolean;
    colourImages: Record<string, string[]>;
    productCode?: string | null; hsn?: string | null; gstRate?: number; silkMark?: boolean; preorder?: boolean; earlyAccess?: boolean; care?: string | null; tags?: string[]; collections?: string[];
    variants: { id: string; label: string; colour: string | null; sku: string | null; price: number | null; stock: number }[];
  } | null;
  categories: Cat[];
}) {
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      id: v.id,
      label: v.label,
      colour: v.colour ?? "",
      sku: v.sku ?? "",
      price: v.price != null ? (v.price / 100).toString() : "",
      stock: v.stock,
    })) ?? [{ label: "Free Size", colour: "", sku: "", price: "", stock: 10 }]
  );
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState((product?.images ?? []).join("\n"));
  const [videos, setVideos] = useState((product?.videos ?? []).join("\n"));
  const [uploadingVideo, setUploadingVideo] = useState(false);
  /** "3 of 5" while a batch is going up. */
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  // Photos per colour. Keys come from whatever colours are typed in the rows
  // below, so the two stay in step automatically.
  const [colourImages, setColourImages] = useState<Record<string, string[]>>(
    product?.colourImages ?? {}
  );
  const [uploadingColour, setUploadingColour] = useState<string | null>(null);

  const colours = Array.from(
    new Set(variants.map((v) => v.colour.trim()).filter(Boolean))
  );

  const uploadForColour = async (colour: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingColour(colour);
    setProgress({ done: 0, total: files.length });
    const { urls, errors } = await uploadImages(files, setProgress);
    if (urls.length)
      setColourImages((prev) => ({ ...prev, [colour]: [...(prev[colour] ?? []), ...urls] }));
    if (errors.length) alert(errors.join("\n"));
    setUploadingColour(null);
    setProgress(null);
    e.target.value = "";
  };

  const removeColourImage = (colour: string, i: number) =>
    setColourImages((prev) => ({
      ...prev,
      [colour]: (prev[colour] ?? []).filter((_, j) => j !== i),
    }));

  const setV = (i: number, k: keyof VariantRow, val: string | number) =>
    setVariants((prev) => prev.map((v, j) => (j === i ? { ...v, [k]: val } : v)));

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const { urls, errors } = await uploadImages(files, setProgress);
    if (urls.length)
      setImages((prev) => (prev ? prev + "\n" + urls.join("\n") : urls.join("\n")));
    if (errors.length) alert(errors.join("\n"));
    setUploading(false);
    setProgress(null);
    e.target.value = "";
  };

  const uploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setVideos((prev) => (prev ? prev + "\n" + url : url));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Upload failed");
    }
    setUploadingVideo(false);
    e.target.value = "";
  };

  return (
    <form action={saveProduct} className="space-y-6 max-w-3xl">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="images" value={images} />
      <input type="hidden" name="videos" value={videos} />
      <input type="hidden" name="colourImages" value={JSON.stringify(colourImages)} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Product name</label>
          <input name="name" required className="input" defaultValue={product?.name} />
        </div>
        <div>
          <label className="label">Slug (URL)</label>
          <input name="slug" className="input" defaultValue={product?.slug} placeholder="auto-generated" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="categoryId" className="input" defaultValue={product?.categoryId ?? ""}>
            <option value="">- None -</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Price (Rs.)</label>
          <input name="price" type="number" step="0.01" min="0" required className="input"
            defaultValue={product ? product.price / 100 : ""} />
        </div>
        <div>
          <label className="label">Compare-at price (Rs., optional)</label>
          <input name="compareAt" type="number" step="0.01" min="0" className="input"
            defaultValue={product?.compareAt ? product.compareAt / 100 : ""} />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={5} required className="input" defaultValue={product?.description} />
      </div>

      <div>
        <label className="label">Product photos, add as many as you like</label>
        {images.split("\n").filter(Boolean).length > 0 && (
          <div className="grid grid-cols-6 gap-2 mb-3">
            {images.split("\n").filter(Boolean).map((src, i) => (
              <div key={i} className="relative group">
                <div className="aspect-[3/4] bg-sand border border-ink/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setImages(images.split("\n").filter(Boolean).filter((_, j) => j !== i).join("\n"))
                  }
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  x
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-cream text-[9px] text-center py-0.5">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <textarea rows={2} className="input font-mono text-[11px]" value={images} onChange={(e) => setImages(e.target.value)}
          placeholder="One image link per line" />
        <div className="mt-2 flex items-center gap-3">
          <label className="btn-outline !py-2 !px-4 cursor-pointer text-sm">
            {uploading
              ? progress
                ? `Uploading ${progress.done} of ${progress.total}`
                : "Uploading"
              : "+ Add photos"}
            <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading} />
          </label>
          <span className="text-xs text-ink/40">First photo is the main one, best at 1200 x 1600 px</span>
        </div>
      </div>

      <div>
        <label className="label">Videos (one URL per line, shown in the product gallery)</label>
        <textarea rows={2} className="input font-mono text-xs" value={videos} onChange={(e) => setVideos(e.target.value)} />
        <div className="mt-2 flex items-center gap-3">
          <label className="btn-outline !py-2 !px-4 cursor-pointer text-sm">
            {uploadingVideo ? "Uploading" : "Upload video"}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={uploadVideo} disabled={uploadingVideo} />
          </label>
          <span className="text-xs text-ink/40">MP4/WebM/MOV, up to 100MB</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Size & measurements (shown on product page)</label>
          <textarea name="measurements" rows={5} className="input text-xs" defaultValue={product?.measurements ?? ""}
            placeholder={'S, Bust 36", Waist 30", Length 42"\nM, Bust 38"'} />
        </div>
        <div>
          <label className="label">Fabric & care</label>
          <textarea name="fabric" rows={5} className="input text-xs" defaultValue={product?.fabric ?? ""}
            placeholder="Fabric details, wash care instructions" />
        </div>
        <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 border-t border-gold/20 pt-4">
          <div>
            <label className="label">Product code (generated)</label>
            <input className="input bg-sand/60" readOnly value={product?.productCode ?? "assigned on save"} />
            <p className="text-xs text-ink/40 mt-1">RUD, fabric code, running number. Variant SKUs add 01, 02 and so on.</p>
          </div>
          <div>
            <label className="label">HSN code</label>
            <input name="hsn" className="input" defaultValue={product?.hsn ?? ""} placeholder="5007 silk, 5208 cotton and kota, 5309 linen" />
          </div>
          <div>
            <label className="label">GST rate (percent, prices are inclusive)</label>
            <input name="gstRate" type="number" min={0} max={28} className="input" defaultValue={product?.gstRate ?? 5} />
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input name="tags" className="input" defaultValue={(product?.tags ?? []).join(", ")} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Collections (comma separated handles, for example saree-demo, best-sellers, unique-pieces)</label>
            <input name="collections" className="input" defaultValue={(product?.collections ?? []).join(", ")} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Fabric care (shown on the product page)</label>
            <textarea name="care" rows={2} className="input text-xs" defaultValue={product?.care ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="silkMark" defaultChecked={!!product?.silkMark} /> Silk Mark certified</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="preorder" defaultChecked={!!product?.preorder} /> Pre-order, ships in 5 to 10 working days</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="earlyAccess" defaultChecked={!!product?.earlyAccess} /> Early access for Rudrika Circle members</label>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="label !mb-0">Sizes, colours & stock</label>
          <button type="button" className="text-sm underline hover:text-clay"
            onClick={() =>
              setVariants([
                ...variants,
                { label: "", colour: variants[variants.length - 1]?.colour ?? "", sku: "", price: "", stock: 0 },
              ])
            }>
            + Add row
          </button>
        </div>
        <p className="text-xs text-ink/45 mb-3">
          One row per size. If the piece comes in more than one colour, add a row for each
          size <em>and</em> colour, that way &ldquo;Rust M&rdquo; can sell out while
          &ldquo;Green M&rdquo; stays available. Leave Colour blank for single-colour pieces.
          <strong className="text-ink/60"> Set stock to 0 and that option shows as sold out.</strong>
        </p>
        <div className="grid grid-cols-[1fr_1fr_1fr_100px_80px_32px] gap-2 mb-1 text-[10px] uppercase tracking-wider text-ink/40">
          <span>Size</span><span>Colour</span><span>SKU</span><span>Price override</span><span>Stock</span><span />
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_100px_80px_32px] gap-2 items-center">
              <input placeholder="M" required className="input !py-2" value={v.label}
                onChange={(e) => setV(i, "label", e.target.value)} />
              <input placeholder="Rust (optional)" className="input !py-2" value={v.colour}
                onChange={(e) => setV(i, "colour", e.target.value)} list="colour-suggestions" />
              <input placeholder="auto" title="Generated from the fabric and product number on save" className="input !py-2 bg-sand/60" value={v.sku} readOnly />
              <input placeholder="Rs." type="number" step="0.01" className="input !py-2" value={v.price}
                onChange={(e) => setV(i, "price", e.target.value)} />
              <input type="number" min="0" required
                className={`input !py-2 ${v.stock === 0 ? "!border-red-300 !text-red-600" : ""}`}
                value={v.stock}
                onChange={(e) => setV(i, "stock", parseInt(e.target.value) || 0)} />
              <button type="button" className="text-ink/40 hover:text-red-600"
                onClick={() => setVariants(variants.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <datalist id="colour-suggestions">
          {colours.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      {colours.length > 0 && (
        <div>
          <label className="label">Photos for each colour</label>
          <p className="text-xs text-ink/45 mb-3">
            When a customer picks a colour, these photos replace the gallery. A colour with no
            photos of its own falls back to the main product photos above.
          </p>
          <div className="space-y-4">
            {colours.map((c) => (
              <div key={c} className="border border-ink/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c}</span>
                  <label className="btn-outline !py-1.5 !px-3 cursor-pointer text-xs">
                    {uploadingColour === c
                      ? progress
                        ? `Uploading ${progress.done} of ${progress.total}`
                        : "Uploading"
                      : "+ Add photos"}
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => uploadForColour(c, e)} disabled={uploadingColour !== null} />
                  </label>
                </div>
                {(colourImages[c] ?? []).length === 0 ? (
                  <p className="text-xs text-ink/35">No photos yet, will use the main photos.</p>
                ) : (
                  <div className="grid grid-cols-8 gap-2">
                    {(colourImages[c] ?? []).map((src, i) => (
                      <div key={i} className="relative group">
                        <div className="aspect-[3/4] bg-sand border border-ink/10 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-contain" />
                        </div>
                        <button type="button" onClick={() => removeColourImage(c, i)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> Published
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Featured on homepage
        </label>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary">{product ? "Save Changes" : "Create Product"}</button>
        {product && (
          <button formAction={deleteProduct} name="id" value={product.id} className="btn border border-red-300 text-red-600 hover:bg-red-50"
            onClick={(e) => { if (!confirm("Delete this product permanently?")) e.preventDefault(); }}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
