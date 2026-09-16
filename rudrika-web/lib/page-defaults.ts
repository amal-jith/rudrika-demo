// Default content for the editable pages. Everything here can be changed from
// Admin, Website Pages. Written for Rudrika by Tara; the client supplies final
// policy wording per the agreement.
export type Block = { heading: string; body: string };
export type PageSeed = { slug: string; title: string; subtitle: string; blocks: Block[] };

export const PAGE_SEEDS: PageSeed[] = [
  {
    slug: "about",
    title: "Our story",
    subtitle: "Handcrafted sarees, designed for your story",
    blocks: [
      { heading: "Rudrika by Tara", body: "Rudrika is a thoughtful fashion brand celebrating India's cultural heritage through sarees. It is for women who value individuality, purpose and beauty in everyday living. By blending age-old techniques with a modern lens, Rudrika curates capsule wardrobe pieces that are ethically sourced." },
      { heading: "What we believe", body: "Celebrate India's rich textile heritage through sarees thoughtfully crafted by skilled artisans. At Rudrika, we believe in ethical sourcing, sustainable practices and truly meaningful fashion." },
      { heading: "Crafted with purpose", body: "We design with intention, not excess. Every Rudrika piece is thoughtfully created, blending clean aesthetics with handcrafted techniques, ensuring comfort, functionality and timeless appeal." },
      { heading: "Quality, always", body: "From sourcing to finishing, we focus on what truly matters. We work closely with artisans, select materials carefully and refine every detail, delivering honest quality that lasts, without compromise." },
      { heading: "Care beyond purchase", body: "Our relationship does not end at checkout. We believe in personal service, transparent communication and standing by our customers, just as we stand by the people who create our products." },
      { heading: "Visit us", body: "Rudrika (Texra Trends Building), Amulya Street, Banerji Road, Ernakulam, Kerala 682018. WhatsApp +91 96496 41985, contact@rudrika.in." },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping policy",
    subtitle: "Across India, in 5 to 7 working days",
    blocks: [
      { heading: "Where we ship", body: "We ship across India. We do not ship outside India at present." },
      { heading: "Charges", body: "Shipping is Rs. 150 per saree and Rs. 80 for accessories. Shipping is free on orders above Rs. 4,999. Rudrika Circle members get free shipping on every order." },
      { heading: "Dispatch and delivery", body: "Orders are dispatched in 1 to 2 working days. Delivery takes 5 to 7 working days depending on your location. Pre-order pieces ship in 5 to 10 working days." },
      { heading: "Tracking", body: "Once your parcel is handed to the courier, the courier name and tracking number are shared on WhatsApp and shown under Track your order. Courier tracking is also available at rudrika.shiprocket.co/tracking." },
    ],
  },
  {
    slug: "returns",
    title: "Returns and refunds",
    subtitle: "For defects and transit damage only",
    blocks: [
      { heading: "When a return is accepted", body: "Returns are accepted only for manufacturing defects or damage in transit. Please record an unboxing video when your parcel arrives and report any issue within 24 hours of delivery on WhatsApp or by email, with the video." },
      { heading: "What cannot be returned", body: "Handloom pieces carry small irregularities that are part of the weave. Colours may vary slightly between screens and the saree. These are not defects. Sarees that have been worn, washed or altered cannot be returned." },
      { heading: "Refunds", body: "Approved refunds are made to the original payment method within 7 working days of the returned piece reaching us." },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy policy",
    subtitle: "How we look after your details",
    blocks: [
      { heading: "What we collect", body: "When you register, enquire or place an order we collect your name, phone number, email address and delivery address, together with your order history. If you opt in, we also record your choice to receive updates on WhatsApp." },
      { heading: "Why we collect it", body: "To process and deliver your orders, issue GST invoices, send order updates by email and on WhatsApp, run the loyalty points programme and the Rudrika Circle membership, moderate reviews and customer photos, and reply to your enquiries." },
      { heading: "Payments", body: "Payments are processed by Razorpay. Your card, UPI and bank details are entered on Razorpay's secure pages and are never stored by Rudrika." },
      { heading: "WhatsApp", body: "Order updates on WhatsApp are sent through the WhatsApp Business Platform (Meta). Marketing messages are sent only with your consent, and you can withdraw it at any time by replying STOP or writing to us." },
      { heading: "Who we share it with", body: "Only with the partners needed to serve you: our courier for delivery, Razorpay for payment and Meta for WhatsApp messages. We never sell your data." },
      { heading: "Photos you share", body: "Photos you submit under Wearing Rudrika are shown on the website and on our social media only after you give consent and after we approve them. Ask us to remove one at any time." },
      { heading: "Your rights", body: "Write to contact@rudrika.in to see, correct or delete the personal data we hold about you. We keep order and invoice records for as long as tax law requires. This policy is in line with the Digital Personal Data Protection Act, 2023." },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    subtitle: "The simple rules for shopping with us",
    blocks: [
      { heading: "Prices and payment", body: "All prices are in Indian rupees and include GST. Payment is collected through Razorpay. A GST invoice is issued for every paid order." },
      { heading: "Orders", body: "An order is confirmed when payment is received. If a piece is unavailable after you have paid, we will offer an alternative or a full refund." },
      { heading: "Loyalty points and coupons", body: "Points and coupons have no cash value and are personal to your account. Rudrika may change the programme rules; points already earned are honoured." },
      { heading: "Rudrika Circle", body: "The membership runs for one year from purchase and does not renew automatically. We remind you before it ends." },
      { heading: "Contact", body: "Rudrika, Texra Trends Building, Amulya Street, Banerji Road, Ernakulam, Kerala 682018. contact@rudrika.in, +91 96496 41985." },
    ],
  },
  {
    slug: "styling",
    title: "Styled by Rudrika",
    subtitle: "Not sure which drape? Tara helps you choose",
    blocks: [
      { heading: "How it works", body: "Send the occasion, your favourite colours and a budget on WhatsApp. Tara replies with a short edit of sarees and blouse ideas. Pick one, pay securely, and it is on its way in 1 to 2 working days." },
      { heading: "Wearing Rudrika", body: "Share a photo of you in your saree from your account. Once approved it appears in our gallery and a 2% coupon lands on your next order." },
    ],
  },
];
