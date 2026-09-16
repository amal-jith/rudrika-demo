/**
 * Hero designs.
 *
 * Design rule: boutique photos are tall portraits, so text NEVER sits directly
 * on a busy photo. Every template gives the words their own solid colour panel,
 * and photos always sit in a fixed frame (object-cover, aligned to the top so
 * faces and necklines are never cut off).
 */

export type HeroLayout =
  | "atelier"   // colour panel + one framed portrait
  | "duet"      // colour panel + two staggered portraits
  | "gallery"   // colour band on top, three portraits below
  | "spotlight" // portrait centred on colour, text above & below
  | "frame"     // portrait in a gold frame with a caption panel underneath
  | "curtain";  // photo with a solid colour column beside it (magazine style)

export type HeroPalette = "espresso" | "ivory" | "maroon" | "olive" | "midnight" | "blush" | "festive";

export type HeroTemplate = {
  id: string;
  label: string;
  layout: HeroLayout;
  palette: HeroPalette;
  flip?: boolean;   // put the photo on the left instead of the right
  chips?: boolean;  // show the small trust line
};

export const HERO_TEMPLATES: HeroTemplate[] = [
  { id: "atelier-dark",   label: "1, Atelier Espresso, deep brown panel, portrait right", layout: "atelier",   palette: "espresso", chips: true },
  { id: "atelier-ivory",  label: "2, Atelier Ivory, soft cream panel, portrait right",     layout: "atelier",   palette: "ivory" },
  { id: "atelier-maroon", label: "3, Atelier Maroon, maroon panel, portrait left",         layout: "atelier",   palette: "maroon",   flip: true },
  { id: "curtain-dark",   label: "4, Editorial Curtain, photo with dark text column",      layout: "curtain",   palette: "espresso", chips: true },
  { id: "curtain-festive",label: "5, Festive Curtain, warm gold column, for the festive season",  layout: "curtain",   palette: "festive",  chips: true },
  { id: "duet-ivory",     label: "6, Duet Ivory, cream panel with two portraits",          layout: "duet",      palette: "ivory" },
  { id: "duet-midnight",  label: "7, Duet Midnight, near-black with gold, two portraits",  layout: "duet",      palette: "midnight" },
  { id: "gallery-ivory",  label: "8, Gallery Ivory, centred words, three portraits below", layout: "gallery",   palette: "ivory" },
  { id: "gallery-maroon", label: "9, Gallery Maroon, maroon band, three portraits below",  layout: "gallery",   palette: "maroon" },
  { id: "spotlight-dark", label: "10, Spotlight Espresso, one portrait centre stage",      layout: "spotlight", palette: "espresso" },
  { id: "spotlight-olive",label: "11, Spotlight Olive, earthy green, centred portrait",    layout: "spotlight", palette: "olive" },
  { id: "frame-ivory",    label: "12, Framed Ivory, gold frame with caption panel",        layout: "frame",     palette: "ivory" },
  { id: "frame-blush",    label: "13, Framed Blush, dusty rose, gentle and feminine",      layout: "frame",     palette: "blush" },
  { id: "atelier-olive",  label: "14, Atelier Olive, natural green panel, portrait right", layout: "atelier",   palette: "olive" },
  { id: "duet-festive",   label: "15, Duet Festive, warm gold panel, two portraits",       layout: "duet",      palette: "festive",  chips: true },
];

export const heroTemplate = (id?: string) =>
  HERO_TEMPLATES.find((t) => t.id === id) ?? HERO_TEMPLATES[0];

export type Tone = {
  panel: string;      // background + text colour of the words panel
  page: string;       // page background behind photos
  eyebrow: string;
  em: string;
  body: string;
  primaryBtn: string;
  ghostBtn: string;
  statNum: string;
  statLbl: string;
  dotOn: string;
  dotOff: string;
  rule: string;
  frame: string;      // border colour around photos
  chip: string;
};

export const TONES: Record<HeroPalette, Tone> = {
  espresso: {
    panel: "bg-ink text-cream",
    page: "bg-ink",
    eyebrow: "text-gold-light",
    em: "text-gold-light",
    body: "text-cream/75",
    primaryBtn: "btn bg-gold text-ink hover:bg-gold-light",
    ghostBtn: "btn border border-cream/40 text-cream hover:bg-cream/10",
    statNum: "text-gold-light",
    statLbl: "text-cream/60",
    dotOn: "bg-gold",
    dotOff: "bg-cream/30",
    rule: "bg-gold-light/50",
    frame: "border-gold/40",
    chip: "text-cream/65",
  },
  ivory: {
    panel: "bg-[#f6efe2] text-ink",
    page: "bg-[#f6efe2]",
    eyebrow: "text-gold-dark",
    em: "text-clay",
    body: "text-ink/65",
    primaryBtn: "btn bg-clay text-cream hover:bg-clay-dark",
    ghostBtn: "btn border border-ink/25 text-ink hover:bg-ink hover:text-cream",
    statNum: "text-clay",
    statLbl: "text-ink/55",
    dotOn: "bg-clay",
    dotOff: "bg-ink/20",
    rule: "bg-gold/50",
    frame: "border-gold/45",
    chip: "text-ink/55",
  },
  maroon: {
    panel: "bg-clay text-cream",
    page: "bg-clay",
    eyebrow: "text-gold-light",
    em: "text-gold-light",
    body: "text-cream/80",
    primaryBtn: "btn bg-cream text-clay hover:bg-gold-light",
    ghostBtn: "btn border border-cream/50 text-cream hover:bg-cream/15",
    statNum: "text-gold-light",
    statLbl: "text-cream/70",
    dotOn: "bg-gold-light",
    dotOff: "bg-cream/30",
    rule: "bg-gold-light/50",
    frame: "border-gold-light/40",
    chip: "text-cream/70",
  },
  olive: {
    panel: "bg-[#41472f] text-cream",
    page: "bg-[#41472f]",
    eyebrow: "text-[#e4d9ae]",
    em: "text-[#e4d9ae]",
    body: "text-cream/75",
    primaryBtn: "btn bg-[#e4d9ae] text-[#2c3020] hover:bg-cream",
    ghostBtn: "btn border border-cream/45 text-cream hover:bg-cream/15",
    statNum: "text-[#e4d9ae]",
    statLbl: "text-cream/65",
    dotOn: "bg-[#e4d9ae]",
    dotOff: "bg-cream/30",
    rule: "bg-[#e4d9ae]/50",
    frame: "border-[#e4d9ae]/40",
    chip: "text-cream/65",
  },
  midnight: {
    panel: "bg-[#17120d] text-cream",
    page: "bg-[#17120d]",
    eyebrow: "text-gold",
    em: "text-gold",
    body: "text-cream/70",
    primaryBtn: "btn bg-gold text-[#17120d] hover:bg-gold-light",
    ghostBtn: "btn border border-gold/50 text-gold hover:bg-gold/10",
    statNum: "text-gold",
    statLbl: "text-cream/55",
    dotOn: "bg-gold",
    dotOff: "bg-cream/25",
    rule: "bg-gold/50",
    frame: "border-gold/40",
    chip: "text-cream/55",
  },
  blush: {
    panel: "bg-[#f2e3df] text-ink",
    page: "bg-[#f2e3df]",
    eyebrow: "text-clay",
    em: "text-clay",
    body: "text-ink/65",
    primaryBtn: "btn bg-clay text-cream hover:bg-clay-dark",
    ghostBtn: "btn border border-clay/40 text-clay hover:bg-clay hover:text-cream",
    statNum: "text-clay",
    statLbl: "text-ink/55",
    dotOn: "bg-clay",
    dotOff: "bg-clay/25",
    rule: "bg-clay/35",
    frame: "border-clay/25",
    chip: "text-ink/55",
  },
  festive: {
    panel: "bg-[#5a2418] text-cream",
    page: "bg-[#5a2418]",
    eyebrow: "text-[#f3d68f]",
    em: "text-[#f3d68f]",
    body: "text-cream/80",
    primaryBtn: "btn bg-[#f3d68f] text-[#4a1d12] hover:bg-cream",
    ghostBtn: "btn border border-cream/50 text-cream hover:bg-cream/15",
    statNum: "text-[#f3d68f]",
    statLbl: "text-cream/70",
    dotOn: "bg-[#f3d68f]",
    dotOff: "bg-cream/30",
    rule: "bg-[#f3d68f]/55",
    frame: "border-[#f3d68f]/40",
    chip: "text-cream/70",
  },
};

/** Ready-made slides using Rudrika's own campaign photography */
export const RUDRIKA_SLIDES = [
  {
    eyebrow: "Handloom and silk sarees, Kochi",
    title: "Handcrafted sarees,",
    titleEm: "designed for your story",
    subtitle: "Thoughtfully designed sarees rooted in heritage, artistry and timeless elegance.",
    image: "/uploads/campaign/rich-hero-red.jpg",
    ctaLabel: "Shop sarees",
    ctaHref: "/products",
  },
  {
    eyebrow: "New arrivals",
    title: "Freshly woven,",
    titleEm: "just off the loom",
    subtitle: "Fresh designs inspired by culture, colour and craftsmanship.",
    image: "/uploads/campaign/rich-hero-purple.jpg",
    ctaLabel: "See new arrivals",
    ctaHref: "/collections/saree-demo",
  },
  {
    eyebrow: "Unique pieces",
    title: "Made once,",
    titleEm: "and only once",
    subtitle: "Limited edition patterns and hand-detailed finishes, from contemporary drapes to timeless weaves.",
    image: "/uploads/campaign/rich-navy.jpg",
    ctaLabel: "Explore unique pieces",
    ctaHref: "/collections/unique-pieces",
  },
];
