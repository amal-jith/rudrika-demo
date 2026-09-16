// ─── Definitions for the homepage builder ───
// Each section type declares the fields the admin can edit.
// `kind` drives which input the admin form renders.

export type FieldKind = "text" | "textarea" | "image" | "video" | "select" | "number" | "boolean";

export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
};

export type SectionDef = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: Record<string, any>;
};

const BUTTONS: Field[] = [
  { name: "ctaLabel", label: "Button text", kind: "text", placeholder: "Shop New Arrivals" },
  { name: "ctaHref", label: "Button link", kind: "text", placeholder: "/products" },
  { name: "cta2Label", label: "Second button text (optional)", kind: "text" },
  { name: "cta2Href", label: "Second button link", kind: "text", placeholder: "/about" },
];

import { HERO_TEMPLATES, RUDRIKA_SLIDES } from "./hero-templates";

export type Card = {
  title?: string;
  subtitle?: string;
  href?: string;
  image?: string;
};

/** Section types whose cards are edited with the visual card editor */
export const CARD_SECTIONS = ["PRICE_TIERS", "OCCASIONS"];

export type Slide = {
  eyebrow?: string;
  title?: string;
  titleEm?: string;
  subtitle?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export const DEFAULT_SLIDES: Slide[] = RUDRIKA_SLIDES;

export { RUDRIKA_SLIDES };

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "HERO",
    label: "Hero / Banner Slider",
    description:
      "The big banner at the top. Add up to 5 slides, they change automatically. Pick one of 4 designs.",
    fields: [
      {
        name: "template",
        label: "Design template",
        kind: "select",
        options: HERO_TEMPLATES.map((t) => ({ value: t.id, label: t.label })),
      },
      { name: "interval", label: "Seconds each slide stays on screen", kind: "number", placeholder: "6" },
      { name: "cta2Label", label: "Second button text (shown on every slide)", kind: "text" },
      { name: "cta2Href", label: "Second button link", kind: "text", placeholder: "whatsapp" },
      { name: "image2", label: "Second photo (Editorial design only)", kind: "image" },
      { name: "showStats", label: "Show the customer / orders / stores counters", kind: "boolean" },
      { name: "stat1", label: "Counter 1 (number | label)", kind: "text", placeholder: "1,00,000+ | Happy Customers" },
      { name: "stat2", label: "Counter 2", kind: "text", placeholder: "75,000+ | Online Orders" },
      { name: "stat3", label: "Counter 3", kind: "text", placeholder: "2 | Boutique Stores" },
    ],
    defaults: {
      template: "classic",
      slides: DEFAULT_SLIDES,
      interval: 6,
      image2: "/uploads/campaign/editorial-2.jpg",
      cta2Label: "Ask on WhatsApp",
      cta2Href: "whatsapp",
      showStats: true,
      stat1: "1,00,000+ | Happy Customers",
      stat2: "75,000+ | Online Orders",
      stat3: "2 | Boutique Stores",
    },
  },
  {
    type: "CATEGORIES",
    label: "Shop by Category",
    description: "Round category buttons pulled from your Categories list.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "subheading", label: "Sub-heading", kind: "text" },
      {
        name: "style",
        label: "Style",
        kind: "select",
        options: [
          { value: "circles", label: "Round circles" },
          { value: "cards", label: "Large image cards" },
        ],
      },
    ],
    defaults: { heading: "Shop by Category", subheading: "", style: "circles" },
  },
  {
    type: "PRODUCTS",
    label: "Product Row",
    description: "A row of products, featured, newest, or a specific category.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "subheading", label: "Sub-heading", kind: "text" },
      {
        name: "source",
        label: "Which products?",
        kind: "select",
        options: [
          { value: "featured", label: "Featured products" },
          { value: "newest", label: "Newest arrivals" },
          { value: "category", label: "From one category" },
        ],
      },
      { name: "categorySlug", label: "Category slug (if 'From one category')", kind: "text", placeholder: "silk" },
      {
        name: "limit",
        label: "How many to show",
        kind: "number",
        placeholder: "8",
        help:
          "Only this many pieces appear on the homepage, the newest ones first. " +
          "Customers see the rest by tapping the 'View all' link. Keep it at 4 or 8 so the " +
          "homepage stays quick to load on a phone. Maximum 24.",
      },
      { name: "linkLabel", label: "'View all' link text", kind: "text", placeholder: "Shop all" },
      { name: "linkHref", label: "'View all' link", kind: "text", placeholder: "/products" },
    ],
    defaults: { heading: "Tara's picks", subheading: "Pieces the boutique is talking about this week.", source: "featured", limit: 8, linkLabel: "View all sarees", linkHref: "/products" },
  },
  {
    type: "BANNER",
    label: "Promo Banner",
    description:
      "Promotional banners. Show one wide poster, two side-by-side posters, or a photo with your own text over it.",
    fields: [
      {
        name: "mode",
        label: "Banner style",
        kind: "select",
        options: [
          { value: "pair", label: "Two posters side by side (recommended)" },
          { value: "creative", label: "One wide poster" },
          { value: "overlay", label: "Photo with text written over it" },
        ],
      },
      {
        name: "creative",
        label: "Poster 1 image",
        kind: "image",
        help: "Wide artwork, roughly 3:1 (e.g. 1600 × 550 px).",
      },
      { name: "creativeHref", label: "Poster 1 link", kind: "text", placeholder: "/products" },
      { name: "creative2", label: "Poster 2 image (side-by-side mode)", kind: "image" },
      { name: "creative2Href", label: "Poster 2 link", kind: "text", placeholder: "/products" },
      { name: "eyebrow", label: "Small label (text mode)", kind: "text" },
      { name: "title", label: "Heading (text mode)", kind: "text" },
      { name: "subtitle", label: "Text (text mode)", kind: "textarea" },
      { name: "image", label: "Background photo (text mode)", kind: "image" },
      { name: "ctaLabel", label: "Button text", kind: "text" },
      { name: "ctaHref", label: "Button link", kind: "text" },
      {
        name: "align",
        label: "Text position (text mode)",
        kind: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    ],
    defaults: {
      mode: "pair",
      creative: "/uploads/campaign/rich-banner-yellow.jpg",
      creativeHref: "/products",
      creative2: "/uploads/campaign/rich-banner-purple.jpg",
      creative2Href: "/products",
      eyebrow: "The festive edit",
      title: "A saree for every occasion",
      subtitle: "Silk, Banarasi, Tussar, Linen, Cotton and Kota Doria, chosen by Tara and shipped across India.",
      image: "/uploads/campaign/rich-hero-red.jpg",
      ctaLabel: "Explore the collection",
      ctaHref: "/products",
      align: "left",
    },
  },
  {
    type: "VALUES",
    label: "Trust / Values Strip",
    description: "Four short trust points (craft, shipping, delivery, support).",
    fields: [
      { name: "heading", label: "Heading (leave blank to hide)", kind: "text" },
      { name: "item1", label: "Point 1 (title | description)", kind: "text" },
      { name: "item2", label: "Point 2", kind: "text" },
      { name: "item3", label: "Point 3", kind: "text" },
      { name: "item4", label: "Point 4", kind: "text" },
      {
        name: "theme",
        label: "Colour",
        kind: "select",
        options: [
          { value: "dark", label: "Dark brown" },
          { value: "light", label: "Light sand" },
        ],
      },
    ],
    defaults: {
      heading: "",
      item1: "Handcrafted sarees | Woven by artisans, chosen by Tara",
      item2: "Free shipping | On every order above Rs. 4,999",
      item3: "Checked before dispatch | Every saree inspected and packed by hand",
      item4: "Secure payments | UPI, cards and net banking via Razorpay",
      theme: "dark",
    },
  },
  {
    type: "TESTIMONIALS",
    label: "Customer Reviews (sliding)",
    description: "Continuously sliding customer reviews. Manage the list under Admin, Testimonials.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "subheading", label: "Sub-heading", kind: "text" },
      { name: "speed", label: "Slide speed in seconds (higher = slower)", kind: "number", placeholder: "60" },
    ],
    defaults: { heading: "Loved by Our Customers", subheading: "Real reviews from Rudrika customers", speed: 60 },
  },
  {
    type: "VIDEO",
    label: "Video Section",
    description: "A brand film or reel.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "subheading", label: "Sub-heading", kind: "text" },
      { name: "video", label: "Video file", kind: "video" },
      { name: "poster", label: "Cover image (shown before play)", kind: "image" },
    ],
    defaults: { heading: "The Rudrika Edit", subheading: "Timeless drapes curated with love, detail and elegance.", video: "", poster: "" },
  },
  {
    type: "CTA",
    label: "Call-to-Action",
    description: "A closing message with buttons.",
    fields: [
      { name: "title", label: "Heading", kind: "text" },
      { name: "titleEm", label: "Heading (highlighted part)", kind: "text" },
      { name: "subtitle", label: "Text", kind: "textarea" },
      ...BUTTONS,
    ],
    defaults: {
      title: "Find the saree that",
      titleEm: "tells your story.",
      subtitle: "Explore the collection, or message us on WhatsApp for colour advice and blouse pairing.",
      ctaLabel: "Shop sarees",
      ctaHref: "/products",
      cta2Label: "Chat on WhatsApp",
      cta2Href: "whatsapp",
    },
  },
  {
    type: "PRICE_TIERS",
    label: "Shop by Budget",
    description: "Dark cards with price ranges. Add, remove or reorder cards freely.",
    fields: [{ name: "heading", label: "Heading (leave blank to hide)", kind: "text" }],
    defaults: {
      heading: "Shop by budget",
      cards: [
        { title: "Everyday weaves", subtitle: "Under Rs. 5,000", href: "/products?band=under-5000&sort=price-asc", image: "/uploads/campaign/rich-tile-cotton.jpg" },
        { title: "Occasion wear", subtitle: "Rs. 5,000 to 10,000", href: "/products?band=5000-10000", image: "/uploads/campaign/rich-tile-linen.jpg" },
        { title: "Silk and Tussar", subtitle: "Rs. 10,000 to 20,000", href: "/products?band=10000-20000", image: "/uploads/campaign/rich-tile-tussar.jpg" },
        { title: "Heirloom pieces", subtitle: "Above Rs. 20,000", href: "/products?band=above-20000&sort=price-desc", image: "/uploads/campaign/rich-tile-silk.jpg" },
      ],
    },
  },
  {
    type: "MARQUEE",
    label: "Scrolling Sale Bar",
    description: "A bold coloured strip with a message that scrolls across, great for sales.",
    fields: [
      { name: "text", label: "Message", kind: "text", placeholder: "Free shipping across India on orders above Rs. 4,999" },
      { name: "badge", label: "Badge text (optional)", kind: "text", placeholder: "UP TO 40% OFF" },
      { name: "href", label: "Link when clicked", kind: "text", placeholder: "/products" },
      {
        name: "colour",
        label: "Colour",
        kind: "select",
        options: [
          { value: "ink", label: "Deep brown (subtle)" },
          { value: "sand", label: "Sand (very subtle)" },
          { value: "clay", label: "Maroon (bold)" },
          { value: "gold", label: "Gold (bold)" },
        ],
      },
      { name: "speed", label: "Scroll duration in seconds (higher = slower)", kind: "number", placeholder: "55" },
    ],
    defaults: {
      text: "Handcrafted sarees. Free shipping above Rs. 4,999. Delivered across India.",
      badge: "Shop now",
      href: "/products",
      colour: "ink",
      speed: 55,
    },
  },
  {
    type: "OCCASIONS",
    label: "Shop by Occasion",
    description: "Tall photo cards, Weddings, Festive, Party. Add, remove or reorder freely.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "subheading", label: "Sub-heading", kind: "text" },
    ],
    defaults: {
      heading: "Celebrate Every Occasion",
      subheading: "Outfits chosen for the moments that matter",
      cards: [
        { title: "Weddings", subtitle: "", href: "/products?category=silk", image: "/uploads/campaign/rich-tile-silk.jpg" },
        { title: "Festive", subtitle: "", href: "/products?category=banarasi-and-georgette", image: "/uploads/campaign/rich-tile-banarasi.jpg" },
        { title: "Everyday", subtitle: "", href: "/products?category=cotton", image: "/uploads/campaign/rich-tile-cotton.jpg" },
      ],
    },
  },
  {
    type: "RICHTEXT",
    label: "Text Block",
    description: "A simple heading + paragraph block.",
    fields: [
      { name: "heading", label: "Heading", kind: "text" },
      { name: "body", label: "Text", kind: "textarea" },
      {
        name: "align",
        label: "Alignment",
        kind: "select",
        options: [
          { value: "center", label: "Center" },
          { value: "left", label: "Left" },
        ],
      },
    ],
    defaults: { heading: "", body: "", align: "center" },
  },
];

export const defFor = (type: string) => SECTION_DEFS.find((d) => d.type === type);

export function parseData(json: string, type: string): Record<string, any> {
  const def = defFor(type);
  let parsed: Record<string, any> = {};
  try {
    parsed = JSON.parse(json || "{}");
  } catch {}
  return { ...(def?.defaults ?? {}), ...parsed };
}

// "1,00,000+ | Happy Customers" becomes ["1,00,000+", "Happy Customers"]
export function splitPair(s: string | undefined): [string, string] {
  if (!s) return ["", ""];
  const [a, ...rest] = s.split("|");
  return [a.trim(), rest.join("|").trim()];
}

// "Budget Beauties | Under Rs. 3,000 | /products?max=3000" gives 3 parts
export function splitTriple(s: string | undefined): [string, string, string] {
  const [a = "", b = "", c = ""] = (s ?? "").split("|").map((x) => x.trim());
  return [a, b, c];
}
