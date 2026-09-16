/**
 * Browser-side image preparation, shared by every admin uploader.
 *
 * Why this exists: a photo straight off a phone or a DSLR is 8–25 MB. Sending
 * that over a home connection is the reason adding a product felt so slow -
 * most of the wait was upload, not the server. Shrinking the picture *before*
 * it leaves the browser turns a 20 MB file into well under a megabyte, so the
 * same upload finishes in a second or two instead of a minute.
 *
 * The server still runs its own sharp pass afterwards (2000px, WebP). This
 * step only removes the pointless bulk; the server decides final quality.
 */

/** Slightly above the server's 2000px so the server's resize is still the one that matters. */
const CLIENT_MAX_EDGE = 2200;
const CLIENT_QUALITY = 0.9;

/** Formats we must not touch, re-encoding these would lose what makes them useful. */
const PASS_THROUGH = ["image/svg+xml", "image/gif"];

function isProcessableImage(file: File) {
  return file.type.startsWith("image/") && !PASS_THROUGH.includes(file.type);
}

/**
 * Decode honouring EXIF rotation. `createImageBitmap` does this natively in
 * modern browsers; without the flag a portrait phone photo can come out on its
 * side. Older browsers fall back to an <img>, which applies rotation anyway.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image"));
      img.src = url;
    });
  } finally {
    // Revoked on the next tick so the decode above has finished with it.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Returns a smaller version of the file, or the original when shrinking it
 * wouldn't help, a already-small image, an unsupported format, or a canvas
 * that somehow came out bigger than what we started with.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!isProcessableImage(file)) return file;

  try {
    const bitmap = await decode(file);
    const w = "width" in bitmap ? bitmap.width : 0;
    const h = "height" in bitmap ? bitmap.height : 0;
    if (!w || !h) return file;

    const scale = Math.min(1, CLIENT_MAX_EDGE / Math.max(w, h));
    // Nothing to gain: small picture in a format the server handles well.
    if (scale === 1 && file.size < 1_200_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", CLIENT_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    // Anything unexpected: send the original rather than block the upload.
    return file;
  }
}

export type UploadProgress = { done: number; total: number };

/**
 * Shrink and upload several files at once.
 *
 * Uploads run in parallel with a small cap. Sequential uploads were the other
 * half of the slowness: five photos meant five round trips end to end.
 * Returns the URLs in the order the files were chosen, so the photo order the
 * admin picked is the order that gets saved.
 */
export async function uploadImages(
  files: File[],
  onProgress?: (p: UploadProgress) => void,
  concurrency = 3
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: (string | null)[] = new Array(files.length).fill(null);
  const errors: string[] = [];
  let done = 0;
  let next = 0;

  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= files.length) return;
      const original = files[i];
      try {
        const prepared = await shrinkImage(original);
        const fd = new FormData();
        fd.append("file", prepared);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          urls[i] = url;
        } else {
          const d = await res.json().catch(() => ({}));
          errors.push(`${original.name}: ${d.error ?? "upload failed"}`);
        }
      } catch (e) {
        errors.push(`${original.name}: ${(e as Error).message}`);
      } finally {
        done += 1;
        onProgress?.({ done, total: files.length });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, worker)
  );

  return { urls: urls.filter((u): u is string => !!u), errors };
}
