"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCan } from "./auth";
import { getRudrikaSettings, num } from "./settings";
import { addPoints, activateMembership } from "./loyalty";
import { waPhotoReward, sendEvent } from "./whatsapp-events";
import { slugify } from "./utils";

// ---------- Wearing Rudrika photos ----------
export async function reviewPhoto(formData: FormData) {
  await requireCan("photos");
  const id = formData.get("id") as string;
  const approve = formData.get("approve") === "1";
  const photo = await db.customerPhoto.findUnique({ where: { id }, include: { user: true } });
  if (!photo) return;
  if (!approve) {
    await db.customerPhoto.update({ where: { id }, data: { status: "REJECTED", reviewedAt: new Date() } });
  } else if (photo.status !== "APPROVED") {
    const s = await getRudrikaSettings();
    const percent = Math.max(1, num(s.photo_coupon_percent, 2));
    const code = `WEAR-${photo.user.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "RUD"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await db.coupon.create({ data: { code, type: "PERCENT", value: percent, minOrder: 0, maxUses: 1, singleUse: true, customerId: photo.userId, active: true, note: "Wearing Rudrika photo reward" } });
    await db.customerPhoto.update({ where: { id }, data: { status: "APPROVED", couponCode: code, reviewedAt: new Date() } });
    waPhotoReward(photo.user, code, String(percent));
  }
  revalidatePath("/admin/photos");
  revalidatePath("/products");
}
export async function deletePhoto(formData: FormData) {
  await requireCan("photos");
  await db.customerPhoto.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin/photos");
}

// ---------- Loyalty ----------
export async function adjustPoints(formData: FormData) {
  await requireCan("loyalty");
  const userId = formData.get("userId") as string;
  const delta = Math.round(Number(formData.get("delta")) || 0);
  const note = ((formData.get("note") as string) || "Manual adjustment").trim();
  if (userId && delta) await addPoints(userId, delta, "ADJUST", { note });
  revalidatePath("/admin/loyalty");
}

// ---------- Membership ----------
export async function grantMembership(formData: FormData) {
  await requireCan("membership");
  const userId = formData.get("userId") as string;
  if (userId) await activateMembership(userId, null, 0);
  revalidatePath("/admin/membership");
}
export async function endMembership(formData: FormData) {
  await requireCan("membership");
  const userId = formData.get("userId") as string;
  await db.membership.updateMany({ where: { userId, active: true }, data: { active: false } });
  await db.user.update({ where: { id: userId }, data: { membershipExpiresAt: new Date() } });
  revalidatePath("/admin/membership");
}

// ---------- Letters from Tara (blog) ----------
export async function savePost(formData: FormData) {
  await requireCan("blog");
  const id = (formData.get("id") as string) || null;
  const title = (formData.get("title") as string).trim();
  const slug = slugify(((formData.get("slug") as string) || title).trim());
  const body = (formData.get("body") as string) || "";
  const excerpt = ((formData.get("excerpt") as string) || body.split("\n")[0]).trim().slice(0, 300) || null;
  const cover = ((formData.get("cover") as string) || "").trim() || null;
  const published = formData.get("published") === "on";
  const publishedAt = formData.get("publishedAt") ? new Date(formData.get("publishedAt") as string) : new Date();
  const data = { title, slug, body, excerpt, cover, published, publishedAt };
  if (id) await db.post.update({ where: { id }, data });
  else await db.post.create({ data });
  revalidatePath("/letters");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=1");
}
export async function deletePost(formData: FormData) {
  await requireCan("blog");
  await db.post.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/letters");
  revalidatePath("/admin/blog");
}

// ---------- Collections ----------
export async function saveCollection(formData: FormData) {
  await requireCan("collections");
  const id = (formData.get("id") as string) || null;
  const title = (formData.get("title") as string).trim();
  const handle = slugify(((formData.get("handle") as string) || title).trim());
  const subtitle = ((formData.get("subtitle") as string) || "").trim() || null;
  const image = ((formData.get("image") as string) || "").trim() || null;
  const sort = Math.round(Number(formData.get("sort")) || 0);
  const enabled = formData.get("enabled") === "on";
  const data = { title, handle, subtitle, image, sort, enabled };
  if (id) await db.collection.update({ where: { id }, data });
  else await db.collection.create({ data });
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
}
export async function deleteCollection(formData: FormData) {
  await requireCan("collections");
  await db.collection.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
}

// ---------- WhatsApp ----------
export async function resendWhatsApp(formData: FormData) {
  await requireCan("whatsapp");
  const log = await db.whatsAppLog.findUnique({ where: { id: formData.get("id") as string } });
  if (!log) return;
  await sendEvent("MANUAL", { to: log.to, text: log.text, orderId: log.orderId ?? undefined, userId: log.userId ?? undefined });
  revalidatePath("/admin/whatsapp");
}
