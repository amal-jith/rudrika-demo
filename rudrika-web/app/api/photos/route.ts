import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];

/** Customer wearing-photo upload. Stored as webp, waits for admin approval. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || !file.size) return NextResponse.json({ error: "No photo" }, { status: 400 });
  if (!TYPES.includes(file.type) && !file.type.startsWith("image/")) return NextResponse.json({ error: "Please upload a JPG, PNG or WebP photo" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Photos up to 20MB" }, { status: 400 });
  const consent = form.get("consent") === "1" || form.get("consent") === "on";
  if (!consent) return NextResponse.json({ error: "Consent is required" }, { status: 400 });
  const pending = await db.customerPhoto.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending >= 5) return NextResponse.json({ error: "You already have 5 photos waiting for review" }, { status: 429 });

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "That file could not be read as a photo" }, { status: 400 });
  }
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "photos");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), out);

  const productId = String(form.get("productId") || "") || null;
  const product = productId ? await db.product.findUnique({ where: { id: productId }, select: { id: true } }) : null;
  const photo = await db.customerPhoto.create({
    data: { userId: user.id, productId: product?.id ?? null, image: `/uploads/photos/${name}`, caption: String(form.get("caption") || "").slice(0, 140) || null, consent: true, status: "PENDING" },
  });
  return NextResponse.json({ ok: true, id: photo.id });
}
