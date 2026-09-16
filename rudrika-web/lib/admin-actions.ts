"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCan } from "./auth";
import { STAFF_ROLES, type StaffRole } from "./permissions";
import { slugify } from "./utils";
import { SECTION_DEFS, CARD_SECTIONS } from "./section-types";
import { ensureSkus } from "./sku";
import { assignInvoiceNumber } from "./gst";
import { addPoints, earnForDeliveredOrder } from "./loyalty";
import { waPacked, waShipped, waDelivered, waFeedback } from "./whatsapp-events";
import { getRudrikaSettings, num } from "./settings";

function revalidateStore() {
  revalidatePath("/", "layout");
}

// ---------- Products ----------
export async function saveProduct(formData: FormData) {
  await requireCan("products");
  const id = (formData.get("id") as string) || null;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim();
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const compareAtRaw = formData.get("compareAt") as string;
  const compareAt = compareAtRaw ? Math.round(parseFloat(compareAtRaw) * 100) : null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const featured = formData.get("featured") === "on";
  const published = formData.get("published") === "on";
  const images = JSON.stringify(
    (formData.get("images") as string)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const videos = JSON.stringify(
    ((formData.get("videos") as string) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const measurements = ((formData.get("measurements") as string) || "").trim() || null;
  const fabric = ((formData.get("fabric") as string) || "").trim() || null;

  // Per-colour photo sets, kept as a JSON object keyed by colour name.
  let colourImages = "{}";
  try {
    const parsed = JSON.parse((formData.get("colourImages") as string) || "{}");
    // Drop colours with no photos so the blob stays tidy.
    const cleaned = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => Array.isArray(v) && v.length > 0)
    );
    colourImages = JSON.stringify(cleaned);
  } catch {}

  // variants come as JSON from the form
  const variants: { id?: string; label: string; colour?: string; sku?: string; price?: string; stock: number }[] =
    JSON.parse((formData.get("variants") as string) || "[]");

  let slug = (formData.get("slug") as string)?.trim() || slugify(name);
  slug = slugify(slug);

  const hsn = ((formData.get("hsn") as string) || "").trim() || null;
  const gstRate = Math.max(0, Math.round(Number(formData.get("gstRate") || 5)));
  const silkMark = formData.get("silkMark") === "on";
  const preorder = formData.get("preorder") === "on";
  const earlyAccess = formData.get("earlyAccess") === "on";
  const care = ((formData.get("care") as string) || "").trim() || null;
  const tags = JSON.stringify(((formData.get("tags") as string) || "").split(",").map((t) => t.trim()).filter(Boolean));
  const collections = JSON.stringify(((formData.get("collections") as string) || "").split(",").map((t) => t.trim()).filter(Boolean));
  const data = { name, slug, description, price, compareAt, categoryId, featured, published, images, videos, colourImages, measurements, fabric, hsn, gstRate, silkMark, preorder, earlyAccess, care, tags, collections };

  let productId = id;
  if (id) {
    await db.product.update({ where: { id }, data });
    // sync variants: delete removed, update existing, create new
    const keepIds = variants.filter((v) => v.id).map((v) => v.id!);
    await db.variant.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });
    for (const v of variants) {
      const vd = {
        label: v.label,
        colour: v.colour?.trim() || null,
        sku: v.sku || null,
        price: v.price ? Math.round(parseFloat(v.price) * 100) : null,
        stock: Math.max(0, Math.round(Number(v.stock) || 0)),
      };
      if (v.id) await db.variant.update({ where: { id: v.id }, data: vd });
      else await db.variant.create({ data: { ...vd, productId: id } });
    }
  } else {
    const created = await db.product.create({ data });
    productId = created.id;
    for (const v of variants) {
      await db.variant.create({
        data: {
          productId: created.id,
          label: v.label,
          colour: v.colour?.trim() || null,
          sku: v.sku || null,
          price: v.price ? Math.round(parseFloat(v.price) * 100) : null,
          stock: Math.max(0, Math.round(Number(v.stock) || 0)),
        },
      });
    }
  }
  if (productId) await ensureSkus(productId);
  revalidateStore();
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(formData: FormData) {
  await requireCan("products");
  await db.product.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  redirect("/admin/products");
}

// ---------- Orders ----------
export async function updateOrderStatus(formData: FormData) {
  await requireCan("orders");
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const paymentStatus = (formData.get("paymentStatus") as string | null) || null;
  const courier = ((formData.get("courier") as string) || "").trim() || null;
  const awb = ((formData.get("awb") as string) || "").trim() || null;
  const before = await db.order.findUnique({ where: { id }, select: { status: true, paymentStatus: true } });
  const now = new Date();
  const order = await db.order.update({
    where: { id },
    data: {
      status,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(courier !== null ? { courier } : {}),
      ...(awb !== null ? { awb } : {}),
      ...(status === "PACKED" && before?.status !== "PACKED" ? { packedAt: now } : {}),
      ...(status === "SHIPPED" && before?.status !== "SHIPPED" ? { shippedAt: now } : {}),
      ...(status === "DELIVERED" && before?.status !== "DELIVERED" ? { deliveredAt: now } : {}),
    },
  });

  // A GST invoice number is issued the first time an order is paid.
  if (order.paymentStatus === "PAID" && before?.paymentStatus !== "PAID") await assignInvoiceNumber(id);

  // WhatsApp events fire once per transition; never awaited on the request path.
  if (status === "PACKED" && before?.status !== "PACKED") waPacked(order);
  if (status === "SHIPPED" && before?.status !== "SHIPPED") waShipped(order);
  if (status === "DELIVERED" && before?.status !== "DELIVERED") {
    waDelivered(order);
    await earnForDeliveredOrder(id);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/** Manual "send the feedback follow-up now" from the order page. */
export async function sendFeedbackNow(formData: FormData) {
  await requireCan("orders");
  const id = formData.get("id") as string;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return;
  await waFeedback(order);
  await db.order.update({ where: { id }, data: { feedbackSentAt: new Date() } });
  revalidatePath(`/admin/orders/${id}`);
}

// ---------- Coupons ----------
export async function saveCoupon(formData: FormData) {
  await requireCan("coupons");
  const code = (formData.get("code") as string).toUpperCase().trim();
  const type = formData.get("type") as string;
  const rawValue = parseFloat(formData.get("value") as string);
  const value = type === "FLAT" ? Math.round(rawValue * 100) : Math.round(rawValue);
  const minOrderRaw = formData.get("minOrder") as string;
  const minOrder = minOrderRaw ? Math.round(parseFloat(minOrderRaw) * 100) : 0;
  const maxUsesRaw = formData.get("maxUses") as string;
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw) : null;
  const expiresRaw = formData.get("expiresAt") as string;
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

  await db.coupon.upsert({
    where: { code },
    update: { type, value, minOrder, maxUses, expiresAt },
    create: { code, type, value, minOrder, maxUses, expiresAt },
  });
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(formData: FormData) {
  await requireCan("coupons");
  const id = formData.get("id") as string;
  const c = await db.coupon.findUnique({ where: { id } });
  if (c) await db.coupon.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await requireCan("coupons");
  await db.coupon.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin/coupons");
}

// ---------- Reviews ----------
export async function setReviewApproval(formData: FormData) {
  await requireCan("reviews");
  const id = formData.get("id") as string;
  const approve = formData.get("approve") === "1";
  const before = await db.review.findUnique({ where: { id }, select: { approved: true, userId: true } });
  await db.review.update({ where: { id }, data: { approved: approve } });
  if (approve && before && !before.approved) {
    const s = await getRudrikaSettings();
    await addPoints(before.userId, num(s.loyalty_review_points, 25), "REVIEW", { note: "Approved review" });
  }
  revalidateStore();
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireCan("reviews");
  await db.review.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  revalidatePath("/admin/reviews");
}

// ---------- Homepage sections (CMS) ----------
export async function addSection(formData: FormData) {
  await requireCan("homepage");
  const type = formData.get("type") as string;
  const def = SECTION_DEFS.find((d) => d.type === type);
  if (!def) return;
  const max = await db.homeSection.aggregate({ _max: { sort: true } });
  const chosen = (formData.get("template") as string) || "";
  const data: Record<string, any> = { ...def.defaults };
  if (type === "HERO" && chosen) data.template = chosen;

  await db.homeSection.create({
    data: {
      type,
      title: def.label,
      sort: (max._max.sort ?? 0) + 1,
      data: JSON.stringify(data),
    },
  });
  revalidateStore();
  revalidatePath("/admin/homepage");
}

export async function saveSection(formData: FormData) {
  await requireCan("homepage");
  const id = formData.get("__id") as string;
  const section = await db.homeSection.findUnique({ where: { id } });
  if (!section) return;
  const def = SECTION_DEFS.find((d) => d.type === section.type);
  const data: Record<string, any> = {};
  for (const f of def?.fields ?? []) {
    const raw = formData.get(f.name);
    if (f.kind === "boolean") data[f.name] = raw === "on";
    else if (f.kind === "number") data[f.name] = raw ? Number(raw) : undefined;
    else data[f.name] = ((raw as string) ?? "").trim();
  }
  // Hero slides come from a dedicated editor as JSON
  if (section.type === "HERO") {
    try {
      data.slides = JSON.parse((formData.get("slides") as string) || "[]");
    } catch {
      data.slides = [];
    }
  }
  // Card-based sections use the visual card editor
  if (CARD_SECTIONS.includes(section.type)) {
    try {
      data.cards = JSON.parse((formData.get("cards") as string) || "[]");
    } catch {
      data.cards = [];
    }
  }
  const title = ((formData.get("__title") as string) || section.title).trim();
  await db.homeSection.update({ where: { id }, data: { data: JSON.stringify(data), title } });
  revalidateStore();
  redirect("/admin/homepage?saved=1");
}

export async function toggleSection(formData: FormData) {
  await requireCan("homepage");
  const id = formData.get("id") as string;
  const s = await db.homeSection.findUnique({ where: { id } });
  if (s) await db.homeSection.update({ where: { id }, data: { enabled: !s.enabled } });
  revalidateStore();
  revalidatePath("/admin/homepage");
}

export async function moveSection(formData: FormData) {
  await requireCan("homepage");
  const id = formData.get("id") as string;
  const dir = formData.get("dir") as string; // up | down
  const all = await db.homeSection.findMany({ orderBy: { sort: "asc" } });
  const i = all.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  await db.homeSection.update({ where: { id: all[i].id }, data: { sort: all[j].sort } });
  await db.homeSection.update({ where: { id: all[j].id }, data: { sort: all[i].sort } });
  revalidateStore();
  revalidatePath("/admin/homepage");
}

/** Persist a new order for homepage blocks (used by drag-and-drop) */
export async function reorderSections(ids: string[]) {
  await requireCan("homepage");
  await Promise.all(
    ids.map((id, i) => db.homeSection.update({ where: { id }, data: { sort: i + 1 } }))
  );
  revalidateStore();
  revalidatePath("/admin/homepage");
}

export async function toggleSectionById(id: string) {
  await requireCan("homepage");
  const s = await db.homeSection.findUnique({ where: { id } });
  if (s) await db.homeSection.update({ where: { id }, data: { enabled: !s.enabled } });
  revalidateStore();
  revalidatePath("/admin/homepage");
}

export async function deleteSection(formData: FormData) {
  await requireCan("homepage");
  await db.homeSection.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  redirect("/admin/homepage");
}

// ---------- Testimonials ----------
export async function saveTestimonial(formData: FormData) {
  await requireCan("testimonials");
  const id = (formData.get("id") as string) || null;
  const data = {
    name: (formData.get("name") as string).trim(),
    text: (formData.get("text") as string).trim(),
    rating: Math.max(1, Math.min(5, parseInt((formData.get("rating") as string) || "5"))),
    image: ((formData.get("image") as string) || "").trim() || null,
  };
  if (id) await db.testimonial.update({ where: { id }, data });
  else {
    const max = await db.testimonial.aggregate({ _max: { sort: true } });
    await db.testimonial.create({ data: { ...data, sort: (max._max.sort ?? 0) + 1 } });
  }
  revalidateStore();
  revalidatePath("/admin/testimonials");
}

export async function toggleTestimonial(formData: FormData) {
  await requireCan("testimonials");
  const id = formData.get("id") as string;
  const t = await db.testimonial.findUnique({ where: { id } });
  if (t) await db.testimonial.update({ where: { id }, data: { enabled: !t.enabled } });
  revalidateStore();
  revalidatePath("/admin/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  await requireCan("testimonials");
  await db.testimonial.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  revalidatePath("/admin/testimonials");
}

// ---------- Content pages ----------
export async function savePage(formData: FormData) {
  await requireCan("pages");
  const id = (formData.get("id") as string) || null;
  const slug = slugify((formData.get("slug") as string) || "");
  const title = (formData.get("title") as string).trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim() || null;
  const blocks = (formData.get("blocks") as string) || "[]";
  if (id) await db.page.update({ where: { id }, data: { title, subtitle, blocks, slug } });
  else await db.page.create({ data: { slug, title, subtitle, blocks } });
  revalidateStore();
  redirect("/admin/pages?saved=1");
}

export async function deletePage(formData: FormData) {
  await requireCan("pages");
  await db.page.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  redirect("/admin/pages");
}

export async function createPage(formData: FormData) {
  await requireCan("pages");
  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return;
  let slug = slugify(((formData.get("slug") as string) || title).trim());
  // ensure unique
  let n = 1;
  while (await db.page.findUnique({ where: { slug } })) slug = `${slugify(title)}-${++n}`;
  await db.page.create({
    data: {
      slug,
      title,
      subtitle: ((formData.get("subtitle") as string) || "").trim() || null,
      blocks: JSON.stringify([{ heading: "Section heading", body: "Write your content here" }]),
    },
  });
  revalidateStore();
  redirect(`/admin/pages/${slug}`);
}

export async function duplicatePage(formData: FormData) {
  await requireCan("pages");
  const source = (formData.get("slug") as string) || "";
  const existing = await db.page.findUnique({ where: { slug: source } });

  let title: string, subtitle: string | null, blocks: string;
  if (existing) {
    title = `${existing.title} (copy)`;
    subtitle = existing.subtitle;
    blocks = existing.blocks;
  } else {
    const { PAGE_SEEDS } = await import("./page-defaults");
    const seed = PAGE_SEEDS.find((p) => p.slug === source);
    if (!seed) return;
    title = `${seed.title} (copy)`;
    subtitle = seed.subtitle;
    blocks = JSON.stringify(seed.blocks);
  }

  let slug = slugify(`${source}-copy`);
  let n = 1;
  while (await db.page.findUnique({ where: { slug } })) slug = `${slugify(source)}-copy-${++n}`;

  await db.page.create({ data: { slug, title, subtitle, blocks } });
  revalidateStore();
  redirect(`/admin/pages/${slug}`);
}

// ---------- Product reviews (admin-authored) ----------
export async function adminSaveReview(formData: FormData) {
  const admin = await requireCan("reviews");
  const id = (formData.get("id") as string) || null;
  const productId = formData.get("productId") as string;
  const rating = Math.max(1, Math.min(5, parseInt((formData.get("rating") as string) || "5")));
  const title = ((formData.get("title") as string) || "").trim() || null;
  const body = ((formData.get("body") as string) || "").trim();
  const authorName = ((formData.get("authorName") as string) || "").trim() || "Happy Customer";
  const approved = formData.get("approved") === "on";
  if (!body) return;

  if (id) {
    await db.review.update({ where: { id }, data: { rating, title, body, approved } });
  } else {
    // reviews are tied to a user; admin-written ones use a shared "store review" account
    const email = `review+${slugify(authorName) || "guest"}@rudrika.local`;
    let author = await db.user.findUnique({ where: { email } });
    if (!author) {
      const bcrypt = (await import("bcryptjs")).default;
      author = await db.user.create({
        data: { email, name: authorName, password: await bcrypt.hash(Math.random().toString(36), 10) },
      });
    } else if (author.name !== authorName) {
      author = await db.user.update({ where: { id: author.id }, data: { name: authorName } });
    }
    const dup = await db.review.findUnique({
      where: { productId_userId: { productId, userId: author.id } },
    });
    if (dup) {
      await db.review.update({ where: { id: dup.id }, data: { rating, title, body, approved } });
    } else {
      await db.review.create({
        data: { productId, userId: author.id, rating, title, body, approved },
      });
    }
  }
  revalidateStore();
  revalidatePath(`/admin/products/${productId}/reviews`);
}

export async function adminDeleteReview(formData: FormData) {
  await requireCan("reviews");
  const id = formData.get("id") as string;
  const productId = formData.get("productId") as string;
  await db.review.delete({ where: { id } });
  revalidateStore();
  revalidatePath(`/admin/products/${productId}/reviews`);
}

// ---------- Settings ----------
export async function saveSetting(formData: FormData) {
  await requireCan("settings");
  const key = formData.get("key") as string;
  const value = ((formData.get("value") as string) || "").trim();
  if (!key) return;
  if (value) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  } else {
    await db.setting.deleteMany({ where: { key } });
  }
  revalidateStore();
  revalidatePath("/admin/settings");
}

// ---------- Categories ----------
export async function saveCategory(formData: FormData) {
  await requireCan("products");
  const id = (formData.get("id") as string) || null;
  const name = (formData.get("name") as string).trim();
  const image = ((formData.get("image") as string) || "").trim() || null;
  const sort = parseInt((formData.get("sort") as string) || "0");
  const slug = slugify(name);
  if (id) await db.category.update({ where: { id }, data: { name, slug, image, sort } });
  else await db.category.create({ data: { name, slug, image, sort } });
  revalidateStore();
  revalidatePath("/admin/categories");
}

export async function toggleCategory(formData: FormData) {
  await requireCan("products");
  const id = formData.get("id") as string;
  const c = await db.category.findUnique({ where: { id } });
  if (c) await db.category.update({ where: { id }, data: { enabled: !c.enabled } });
  revalidateStore();
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireCan("products");
  await db.category.delete({ where: { id: formData.get("id") as string } });
  revalidateStore();
  revalidatePath("/admin/categories");
}

// ---------- Shipping zones ----------

/**
 * Create or update a shipping zone. States are entered comma-separated in the
 * admin form and stored as a JSON array. A blank state list on the default zone
 * is fine, that's the catch-all.
 */
export async function saveShippingZone(formData: FormData) {
  await requireCan("shipping");
  const id = (formData.get("id") as string) || null;
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return;

  const states = JSON.stringify(
    ((formData.get("states") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const rate = Math.max(0, Math.round(parseFloat((formData.get("rate") as string) || "0") * 100));
  const freeRaw = (formData.get("freeAbove") as string) || "";
  const freeAbove = freeRaw.trim() ? Math.max(0, Math.round(parseFloat(freeRaw) * 100)) : null;
  const isDefault = formData.get("isDefault") === "on";
  const enabled = formData.get("enabled") === "on";
  const sort = Math.round(Number(formData.get("sort")) || 0);

  const data = { name, states, rate, freeAbove, isDefault, enabled, sort };

  // Only one zone can be the fallback.
  if (isDefault) {
    await db.shippingZone.updateMany({ data: { isDefault: false }, where: {} });
  }

  if (id) await db.shippingZone.update({ where: { id }, data });
  else await db.shippingZone.create({ data });

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}

export async function deleteShippingZone(formData: FormData) {
  await requireCan("shipping");
  const id = formData.get("id") as string;
  await db.shippingZone.delete({ where: { id } });
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}

/* ─── Gallery stories ──────────────────────────────────────────────
 * One row per event. `photos` arrives as a JSON array from the uploader.
 *
 * `cover` is a leftover from the story circles, which have been removed -
 * nothing renders it any more. It's still written (falling back to the first
 * photo) purely because the column is NOT NULL, and dropping a column on a
 * live database isn't worth the risk for a field nobody reads.
 */
export async function saveGalleryStory(formData: FormData) {
  await requireCan("gallery");
  const id = (formData.get("id") as string) || null;
  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return;

  const subtitleRaw = ((formData.get("subtitle") as string) || "").trim();
  const photosRaw = (formData.get("photos") as string) || "[]";

  let photos: string[] = [];
  try {
    const parsed = JSON.parse(photosRaw);
    if (Array.isArray(parsed)) photos = parsed.filter((s) => typeof s === "string" && s);
  } catch {}

  const cover = ((formData.get("cover") as string) || "").trim() || photos[0] || "";

  const storyRaw = ((formData.get("story") as string) || "").trim();

  const data = {
    title,
    subtitle: subtitleRaw || null,
    story: storyRaw || null,
    cover,
    photos: JSON.stringify(photos),
    enabled: formData.get("enabled") === "on",
    sort: Math.round(Number(formData.get("sort")) || 0),
  };

  if (id) await db.galleryStory.update({ where: { id }, data });
  else await db.galleryStory.create({ data });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function deleteGalleryStory(formData: FormData) {
  await requireCan("gallery");
  const id = formData.get("id") as string;
  await db.galleryStory.delete({ where: { id } });
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

/* ──────────────────────────────────────────────────────────────────────────
   Staff accounts

   The point of these is that nobody else needs Dan's password. Each person
   gets their own login, their own role, and can be switched off the day they
   stop working here without touching anything else.

   Three rules stop the panel being locked shut by accident. You cannot change
   your own role, you cannot switch yourself off, and the last active owner
   cannot be demoted or disabled. Between them there is always at least one
   person who can get back in.
   ────────────────────────────────────────────────────────────────────────── */

async function activeOwnerCount(excludingId?: string) {
  return db.user.count({
    where: { role: "ADMIN", active: true, ...(excludingId ? { id: { not: excludingId } } : {}) },
  });
}

export async function saveStaff(formData: FormData) {
  const me = await requireCan("staff");

  const id = (formData.get("id") as string) || "";
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const role = (formData.get("role") as string) || "STAFF";
  const password = ((formData.get("password") as string) || "").trim();

  if (!name || !email) return;
  if (!STAFF_ROLES.includes(role as StaffRole)) return;

  const bcrypt = (await import("bcryptjs")).default;

  if (id) {
    const target = await db.user.findUnique({ where: { id }, select: { role: true, active: true } });
    if (!target) return;

    // Changing your own role is how people lock themselves out. Do it from
    // another owner's account, or don't do it.
    if (id === me.id && role !== target.role) return;

    // Never leave the shop without a way in.
    if (target.role === "ADMIN" && role !== "ADMIN" && (await activeOwnerCount(id)) === 0) return;

    await db.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
  } else {
    if (password.length < 8) return;
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // Already a shopper here, promote the account they have rather than
      // refusing, otherwise their order history ends up split across two logins.
      await db.user.update({ where: { id: existing.id }, data: { name, role, active: true } });
    } else {
      await db.user.create({
        data: { name, email, role, active: true, password: await bcrypt.hash(password, 10) },
      });
    }
  }

  revalidatePath("/admin/users");
}

export async function setStaffActive(formData: FormData) {
  const me = await requireCan("staff");
  const id = formData.get("id") as string;
  const active = formData.get("active") === "1";

  if (id === me.id) return; // no switching yourself off
  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return;
  if (!active && target.role === "ADMIN" && (await activeOwnerCount(id)) === 0) return;

  await db.user.update({ where: { id }, data: { active } });
  revalidatePath("/admin/users");
}

/* ──────────────────────────────────────────────────────────────────────────
   Bulk order handling
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Move several orders to the same status in one go.
 *
 * Shipping notifications still fire, one per order, and only for orders that
 * weren't already SHIPPED, the same rule the single-order update follows. The
 * confirm dialog in the table says how many messages that will be, because
 * ticking forty boxes and pressing Shipped is otherwise a very quiet way to
 * send forty WhatsApps.
 */
export async function bulkUpdateOrderStatus(formData: FormData) {
  await requireCan("orders");
  const ids = ((formData.get("ids") as string) || "").split(",").filter(Boolean);
  const status = formData.get("status") as string;
  if (!ids.length || !status) return;

  const before = await db.order.findMany({
    where: { id: { in: ids } },
    select: { id: true, number: true, name: true, phone: true, status: true },
  });

  await db.order.updateMany({ where: { id: { in: ids } }, data: { status } });

  if (status === "SHIPPED") {
    for (const o of before) {
      if (o.status !== "SHIPPED") {
        waShipped(o);
      }
    }
  }

  revalidatePath("/admin/orders");
}
