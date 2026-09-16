// ─── Store contact and policy details ───────────────────────────────
// Edit this one file to update contact info shown across the site.
// Most of these can also be overridden from Admin, Settings.

export const STORE = {
  name: "Rudrika by Tara",
  legalName: "Rudrika",
  tagline: "Handcrafted sarees, designed for your story",
  // Served from this app's own public/uploads folder. Rudrika is a registered
  // trademark: the logo file carries the TM mark and must not be cropped.
  logo: "/uploads/brand/rudrika-logo-maroon.png",
  logoWhite: "/uploads/brand/rudrika-logo-white.png",

  whatsapp: "919649641985", // number used in wa.me links (country code, no +)
  whatsappDisplay: "+91 96496 41985",
  email: "contact@rudrika.in",
  supportEmail: "contact@rudrika.in",

  branches: [
    {
      name: "Rudrika, Ernakulam",
      address: "Rudrika (Texra Trends Building), Amulya Street, Banerji Road, Ernakulam, Kerala 682018",
      phone: "+91 96496 41985",
      email: "contact@rudrika.in",
      map: "https://share.google/xKsWHd4AHxshjpaJr",
    },
  ],

  otherPhones: [] as { label: string; phone: string }[],

  hours: "",

  social: {
    instagram: "https://www.instagram.com/rudrika.by.tara/",
    facebook: "",
  },

  established: "",

  // GST. Prices are GST inclusive. The GSTIN is a placeholder until Tara supplies it.
  gst: {
    gstin: "",
    stateName: "Kerala",
    stateCode: "32",
    invoicePrefix: "RUD/26-27/",
  },

  shipping: {
    freeAbove: "Rs. 4,999",
    perSaree: "Rs. 150",
    accessory: "Rs. 80",
    dispatch: "1 to 2 working days",
    delivery: "5 to 7 working days",
    indiaOnly: true,
    tracking: "https://rudrika.shiprocket.co/tracking",
    cod: false,
  },

  returns: "Returns are accepted only for manufacturing defects or transit damage, reported within 24 hours of delivery with an unboxing video.",
};

export const waLink = (text: string) =>
  `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
