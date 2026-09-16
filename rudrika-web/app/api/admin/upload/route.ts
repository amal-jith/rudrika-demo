import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { queueCompress } from "@/lib/video";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE = 25 * 1024 * 1024; // 25MB in, it gets compressed on the way through
const MAX_VIDEO = 100 * 1024 * 1024; // 100MB

/** Longest edge kept. Nothing on the site is displayed larger than this. */
const MAX_EDGE = 2000;

export async function POST(req: Request) {
  // Owners and Managers upload photos and video. Dispatch accounts have no
  // reason to put files on the server, so they're not allowed to.
  const user = await getUser();
  if (!user || user.active === false || !can(user.role, "products"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo)
    return NextResponse.json({ error: "Unsupported file type (use JPG/PNG/WebP or MP4/WebM/MOV)" }, { status: 400 });
  if (isImage && file.size > MAX_IMAGE)
    return NextResponse.json({ error: "Images: max 25MB" }, { status: 400 });
  if (isVideo && file.size > MAX_VIDEO)
    return NextResponse.json({ error: "Videos: max 100MB" }, { status: 400 });

  let data: Uint8Array = new Uint8Array(await file.arrayBuffer());
  let ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");

  // An iPhone hands us .mov, which Windows and some Android browsers won't
  // play. The compression step below re-encodes it to H.264 regardless, so
  // name it honestly from the start. Safe to change here because the URL is
  // generated fresh on this request, nothing stored is affected.
  if (isVideo && (ext === "mov" || ext === "qt")) ext = "mp4";

  // Photos straight off a phone or camera run to several megabytes, which is
  // slow to serve and slow to resize on every first view. Shrink to something
  // sensible once, here, rather than paying for it on every page load.
  // SVGs are already small and vector, leave them alone.
  if (isImage && file.type !== "image/svg+xml") {
    try {
      const out = await sharp(data)
        .rotate() // honour the EXIF orientation before we discard the metadata
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      data = new Uint8Array(out);
      ext = "webp";
    } catch (e) {
      // A corrupt or exotic file shouldn't block the upload, store the
      // original and let the browser deal with it.
      console.error("[upload] compression skipped:", (e as Error).message);
    }
  }

  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);

  // Videos are compressed after the response goes out, not before it.
  // Encoding a 90MB clip takes minutes; nobody should watch a spinner for
  // that. The file is already on disk and already being served, and the
  // smaller version replaces it under the same name once it's ready.
  if (isVideo) queueCompress(path.join(dir, name));

  // Absolute, not relative, and this matters.
  //
  // Next.js resolves a relative image path against the list of public files it
  // read at startup, so anything uploaded afterwards comes back as "not a valid
  // image" until the app is rebuilt. Handing back a full URL makes Next treat it
  // as an external image and fetch it over HTTP, which Apache serves straight
  // from disk. New photos then appear immediately, with no rebuild.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const url = base ? `${base}/uploads/${name}` : `/uploads/${name}`;

  return NextResponse.json({ url, kind: isVideo ? "video" : "image" });
}
