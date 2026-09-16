# Rudrika build plan for Claude Code

Work through the phases in order. Each phase ends with the check listed under "Done when". Stop and ask Dan only at the points marked DECISION; everything else is decided here or in CLAUDE.md.

## Phase 0. Refresh the prototype for Tara's approval (about 30 minutes)

The prototype in prototype/ is a single HTML file built from prototype/src/ by `python3 prototype/src/build_site.py` (it reads data/DATA.json and writes the HTML). Before the real build, update it so Tara can approve the look:

1. Replace the text logo with the logo image plus the TM mark in the header, footer and invoice. Until the Playbook files arrive, use the current site's transparent logo (URL in assets/ASSETS.md) and add "TM" as superscript text after the wordmark; swap to the official file later.
2. Replace the hero video with a still hero from assets/photos/ (see the manifest for the hero picks; use a landscape image on desktop and a portrait crop on mobile), and swap the "Exclusive designs", "Teera", styling and about images for photos from the same set. Embed these as optimised JPEGs (max 1600px, quality 80) so the file stays self-contained.
3. Apply the kit colours from CLAUDE.md to the prototype's CSS variables (maroon #471113, ivory #fff7f0, gold #c4a580, ink #0e0f1e) and check contrast.
4. Rebuild, open it, click through home, shop, product, checkout and admin, and hand Dan the file to send to Tara.

Done when: the rebuilt prototype opens without console errors and shows the TM logo and the new photography.

## Phase 1. Project setup

1. DECISION: confirm the local path of the Quppayam template repo (Dan has it on this Mac; it is the codebase live at quppayam.com). Copy it to ./rudrika-web (do not build inside the template folder).
2. Create a local PostgreSQL database (Postgres.app, Homebrew or Docker, whichever is present) and write .env from the template list in the ecommerce-client-build skill. Leave the Razorpay keys empty so checkout runs in mock mode. Set NEXT_PUBLIC_STORE_NAME="Rudrika by Tara".
3. `npm install`, `npx prisma db push`, `npm run seed` (fresh local database only), `npm run dev`. Log in to /admin and note the seeded credentials in the terminal, not in chat.
4. Read lib/store-config.ts, tailwind.config.ts, prisma/schema.prisma, lib/permissions.ts and the admin pages before changing anything. Write a short map of the template into docs/TEMPLATE-MAP.md (routes, models, where variants, coupons, invoices and WhatsApp live).

Done when: the template runs locally with the seed data and you can place a mock order.

## Phase 2. Rebrand

1. lib/store-config.ts: names, tagline ("Handcrafted sarees, designed for your story"), legal name "Rudrika", branch address, phone, email, Instagram, WhatsApp number 919649641985, hours (ask Dan if needed, else omit), shipping copy from CLAUDE.md, Shiprocket tracking link.
2. tailwind.config.ts and app/globals.css: the five colour slots and three font slots per CLAUDE.md (Cormorant Garamond display, Jost body unless Proxima Nova is licensed, Great Vibes script). Self-host the Google fonts or use next/font.
3. Logo with TM in header, footer, invoice template, email/WhatsApp previews, favicon and og image (assets/brand/ when present, fallback per ASSETS.md).
4. Homepage builder: hero (assets/photos picks), shop-by-fabric tiles (Silk, Banarasi and Georgette, Tussar Silk, Linen, Cotton, Kota Doria), new arrivals, unique pieces, a brand-values block (three values in data/content.json), the Teera everyday-wear block, "Letters from Tara" (latest three posts), newsletter. Announcement bar: "Free shipping across India on orders above Rs. 4,999".
5. lib/page-defaults.ts and CMS pages: about (brand copy), styling ("Styled by Rudrika", with a WhatsApp booking button), FAQ (five questions), contact, shipping policy, refund policy, terms, privacy (write a new privacy policy that covers Razorpay, WhatsApp and the loyalty and membership data; the Shopify one is not reusable).
6. app/layout.tsx metadata: title "Rudrika by Tara | Handloom and silk sarees", description from content.brand.meta_description.

Done when: the home page, a category page and the five policy pages look right on desktop and on a phone, and nothing says Quppayam anywhere (grep for it).

## Phase 3. Catalogue import

1. Write scripts/import-rudrika.ts. It reads data/DATA.json and creates categories (one per fabric), products (slug = handle so old links can be redirected one to one), variants, prices in paise, stock from the scraped availability (available: stock 5 as a placeholder, unavailable: 0; Tara will correct counts in admin), tags, descriptions, care text, HSN and GST rate, Silk Mark flag, pre-order flag, legacy SKU, generated SKU. Sarees are free size: map the template's (colour, size) variant to (variant title, "Free Size"). Idempotent: running twice updates, never duplicates.
2. Write scripts/fetch-rudrika-images.js: download every image URL in DATA.json into public/uploads/products/<handle>/, then run the template's compress script so they become WebP q82 capped at 2000px. Attach images in order; the first image is the card image. Per-colour photo sets are not available from Shopify, so all images attach to the product.
3. Collections: recreate the 10 collections as the template's categories or a collection field (whichever the template supports without a schema change); membership lists are in data/DATA.json collections[].
4. Blog: import the 9 posts (data/content.json blog[]) as CMS pages under /letters/<handle> or the template's equivalent, with dates and the cover images that exist.
5. Redirect map for go-live: /products/<handle> to the new product URL, /collections/<handle> to the category, /blogs/styled-by-rudrika/<handle> to the post, /pages/faq-1 to /faq, /pages/contact to /contact, /policies/* to the policy pages. Put it in next.config.mjs redirects.

Done when: 56 products and 177 variants show in admin with their SKUs, every product has images, and the product page picks a variant and updates price and stock.

## Phase 4. New modules (each is additive; take a pg_dump before every schema change once real data exists)

Build in this order. Follow the prototype's screens (prototype/src/admin.js and app.js show every field and state) but implement with the template's patterns: guardPage(area) on pages, requireCan(area) in server actions.

1. SKUs and labels. Add sku and legacySku to the variant model and productCode to the product model. Generate on create per the scheme in CLAUDE.md; regenerate the suffix if the fabric changes; SKUs are read-only in the UI. Admin page /admin/labels: choose products, quantity per variant, print an A4 sheet 3-up and a 50 x 30 mm thermal layout, Code 128 barcode of the SKU (bwip-js or JsBarcode), product name, variant, SKU, MRP incl. GST. Products CSV export includes SKUs.
2. GST invoicing. Settings: GSTIN, legal name, address, state and state code, invoice prefix (RUD/26-27/), next number. Invoice per paid order with per-line HSN, rate, taxable value (price divided by 1 + rate), CGST and SGST when the shipping state is Kerala, IGST otherwise, shipping line, discounts and points as deductions, Razorpay reference. Printable route and PDF download. /admin/invoices list with a GST report CSV (one row per line item).
3. Customer capture. Checkout requires name, phone, email, full address and PIN; a WhatsApp opt-in checkbox saved on the customer; guest orders create or match a customer by phone or email; customers CSV export includes opt-in, points, tier and membership.
4. Reviews. Use the template's reviews with approval. On approval add reviewPoints (25) to the customer's ledger. Show average rating and count on product cards.
5. Wearing Rudrika photos. Model: CustomerPhoto (customer, product, order optional, image, caption, consent, status, couponCode). Upload from the product page for signed-in customers (image pipeline to WebP), admin moderation page with approve and reject, approval creates a single-use percent coupon (value from a setting, default 2) bound to that customer, shows the photo in a "Wearing Rudrika" gallery on the product page, and queues the WhatsApp reward message. Account page tab listing the customer's photos and coupons.
6. Loyalty points. Models: LoyaltyLedger (customer, delta, reason, order), settings (earnPer100 = 1, pointValue in paise = 100, maxRedeemPercent = 20, welcomePoints = 50, reviewPoints = 25, birthdayPoints = 100, tiers Silver 0, Rose 10,000, Gold 25,000 lifetime spend). Earn when an order is marked delivered; redeem at checkout with a points input capped by the rule; account page shows balance, tier and history; admin page for rules and manual adjustments.
7. Rudrika Circle membership. One plan (name, price Rs. 999 per year, benefits list) editable in admin. Purchase through a normal Razorpay order (annual, no auto-renew; renewal reminder goes out on WhatsApp 14 days before expiry). Members get 5% off and free shipping automatically at checkout and early access flags on products. Account tab and admin members list with expiry dates.
8. WhatsApp hooks (Phase 2 scope, wire now, keep switchable). Events: order confirmed, packed, shipped (with courier and AWB), delivered, feedback follow-up 5 days after delivery, photo approved reward, membership renewal reminder, welcome on first sign-up. Log every message with status. Manual "send follow-up now" on the order page. Template names and language in .env; a settings toggle turns each event on or off.
9. Order tracking page: public /track, order number plus phone, shows the status timeline and the Shiprocket tracking link; the admin order page has a Packed to Shipped step that records courier and AWB.
10. Shop filters: fabric, price band, in stock, on offer, sort; search across title, fabric, tags and description.
11. Pre-order support: flag shows "Pre-order, ships in 5 to 10 working days" on the product and the order line.
12. Staff roles: the template's ADMIN, MANAGER, STAFF plus a STORE_MANAGER level for Ryzenforge's Phase 3 service (products, stock, orders, customers, reviews, photos; no settings, staff, revenue reports).

Done when: every item above works end to end on a phone with mock checkout, and prototype/screenshots/ has a matching screenshot set from the real build.

## Phase 5. Go-live (only after Dan says the VPS and domain are ready)

Follow sections 4, 7 and 9 of the ecommerce-client-build skill: provision, .env with live Razorpay keys entered on the server (never in chat), backups first, deploy, DNS move from Shopify to the VPS (rudrika.in and www), SSL, redirect map live, a real Rs. 1 order placed and refunded, WhatsApp templates approved and firing, Owner account for Tara, staff accounts, the seeded admin removed, all policy pages real, stock counts corrected by Tara, the Store Manager account for Ryzenforge.

DECISIONS to raise with Dan before Phase 5: VPS host and size, domain registrar access, the Owner account email, Razorpay live keys ready, the GSTIN, which WhatsApp number is on the Business Platform, whether Proxima Nova is licensed.
