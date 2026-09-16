"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { getUser } from "./auth";

async function me() {
  const u = await getUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

export async function updateProfile(formData: FormData) {
  const user = await me();
  const name = ((formData.get("name") as string) || "").trim();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  if (name) await db.user.update({ where: { id: user.id }, data: { name, phone } });
  revalidatePath("/account/profile");
  revalidatePath("/account");
}

export async function changePassword(formData: FormData) {
  const user = await me();
  const current = (formData.get("current") as string) || "";
  const next = (formData.get("next") as string) || "";
  if (next.length < 6) return;
  const full = await db.user.findUnique({ where: { id: user.id } });
  if (!full || !(await bcrypt.compare(current, full.password))) return;
  await db.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(next, 10) } });
  revalidatePath("/account/profile");
}

export async function saveAddress(formData: FormData) {
  const user = await me();
  const id = (formData.get("id") as string) || null;
  const data = {
    label: ((formData.get("label") as string) || "Home").trim(),
    name: ((formData.get("name") as string) || "").trim(),
    line1: ((formData.get("line1") as string) || "").trim(),
    line2: ((formData.get("line2") as string) || "").trim() || null,
    city: ((formData.get("city") as string) || "").trim(),
    state: ((formData.get("state") as string) || "").trim(),
    pincode: ((formData.get("pincode") as string) || "").trim(),
    phone: ((formData.get("phone") as string) || "").trim(),
  };
  if (!data.line1 || !data.city || !data.pincode) return;

  if (id) await db.address.update({ where: { id }, data });
  else {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({ data: { ...data, userId: user.id, isDefault: count === 0 } });
  }
  revalidatePath("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const user = await me();
  const id = formData.get("id") as string;
  const a = await db.address.findUnique({ where: { id } });
  if (a?.userId === user.id) await db.address.delete({ where: { id } });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await me();
  const id = formData.get("id") as string;
  await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  await db.address.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
}

export async function removeFromWishlist(formData: FormData) {
  const user = await me();
  const productId = formData.get("productId") as string;
  await db.wishlist.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
  revalidatePath("/wishlist");
}

export async function requestCancelOrder(formData: FormData) {
  const user = await me();
  const id = formData.get("id") as string;
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) return;
  // Only allow while it hasn't shipped
  if (["PENDING", "PLACED"].includes(order.status)) {
    await db.order.update({ where: { id }, data: { status: "CANCELLED" } });
  }
  revalidatePath("/account/orders");
  revalidatePath(`/orders/${id}`);
}
