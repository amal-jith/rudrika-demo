/**
 * Rudrika by Tara seed. Fresh, empty database only. Never run against a
 * database that holds real orders.
 *
 * Creates the Owner account, the shipping zone, the editable pages, the
 * homepage sections, then imports the real catalogue from data/DATA.json.
 * The Owner password is printed to the terminal once, never stored in a file.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PAGE_SEEDS } from "../lib/page-defaults";
import { SECTION_DEFS } from "../lib/section-types";
import { RUDRIKA_SLIDES } from "../lib/hero-templates";
import { importRudrika } from "../scripts/import-rudrika";

const db = new PrismaClient();

async function main() {
  // Owner
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@rudrika.in").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", active: true, name: "Rudrika admin" },
    create: { email, name: "Rudrika admin", role: "ADMIN", active: true, password: await bcrypt.hash(password, 10) },
  });

  // Shipping: flat Rs. 150 per order, free above Rs. 4,999, India only
  if ((await db.shippingZone.count()) === 0) {
    await db.shippingZone.create({ data: { name: "India", states: "[]", rate: 15000, freeAbove: 499900, isDefault: true, enabled: true, sort: 0 } });
  }

  // Pages
  for (const p of PAGE_SEEDS) {
    await db.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, title: p.title, subtitle: p.subtitle, blocks: JSON.stringify(p.blocks), enabled: true },
    });
  }

  // Homepage
  if ((await db.homeSection.count()) === 0) {
    const def = (t: string) => SECTION_DEFS.find((d) => d.type === t)!.defaults;
    const sections: { type: string; title: string; data: Record<string, any> }[] = [
      { type: "HERO", title: "Hero", data: { ...def("HERO"), template: "curtain-dark", slides: RUDRIKA_SLIDES, showStats: false } },
      { type: "CATEGORIES", title: "Shop by fabric", data: { ...def("CATEGORIES"), heading: "Shop by fabric", subheading: "Festive silks, everyday linens and cottons, and the classic handlooms Kerala is loved for", style: "cards" } },
      { type: "PRODUCTS", title: "New arrivals", data: { ...def("PRODUCTS"), heading: "New arrivals", subheading: "Fresh designs inspired by culture, colour and craftsmanship", source: "newest", limit: 8, linkLabel: "See all new arrivals", linkHref: "/collections/saree-demo" } },
      { type: "BANNER", title: "Unique pieces", data: { ...def("BANNER"), mode: "overlay", image: "/uploads/campaign/rich-navy.jpg", eyebrow: "Unique pieces", title: "Made once, and only once", subtitle: "Limited edition patterns and hand-detailed finishes, from contemporary drapes to timeless weaves.", ctaLabel: "Explore unique pieces", ctaHref: "/collections/unique-pieces", align: "left" } },
      { type: "PRODUCTS", title: "Best sellers", data: { ...def("PRODUCTS"), heading: "Best sellers", subheading: "The sarees our customers come back for", source: "featured", limit: 8, linkLabel: "See all best sellers", linkHref: "/collections/best-sellers" } },
      { type: "VALUES", title: "Our values", data: { ...def("VALUES"), heading: "Made with intention", item1: "Crafted with purpose | We design with intention, not excess. Every piece blends clean aesthetics with handcrafted technique.", item2: "Quality, always | We work closely with artisans and refine every detail, for honest quality that lasts.", item3: "Care beyond purchase | Our relationship does not end at checkout. We stand by our customers and the people who weave for us.", item4: "" } },
      { type: "BANNER", title: "Teera", data: { ...def("BANNER"), mode: "overlay", image: "/uploads/campaign/rich-band-teera.jpg", eyebrow: "Teera by Rudrika", title: "Everyday wear, thoughtfully designed", subtitle: "Contemporary drapes and pieces for everyday comfort and effortless style.", ctaLabel: "Discover Teera", ctaHref: "/collections/rudrika-srees", align: "right" } },
      { type: "CTA", title: "Styled by Rudrika", data: { ...def("CTA"), title: "Not sure which drape?", titleEm: "Tara helps you choose", subtitle: "Send the occasion, your favourite colours and a budget on WhatsApp. Tara replies with a short edit of sarees.", ctaLabel: "Book a styling chat", ctaHref: "https://wa.me/919649641985?text=Hi%20Tara%2C%20I%20would%20like%20to%20book%20a%20styling%20session.", cta2Label: "Letters from Tara", cta2Href: "/letters" } },
    ];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      await db.homeSection.create({ data: { type: s.type, title: s.title, sort: i, enabled: true, data: JSON.stringify(s.data) } });
    }
  }

  const r = await importRudrika();
  console.log("Seed complete.", r);
  console.log(`Owner login: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) console.log(`Owner password (shown once, change it after first login): ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
