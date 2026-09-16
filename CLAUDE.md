# Rudrika by Tara, e-commerce build (Ryzenforge)

Read this file first in every session. Then read RUDRIKA-BUILD-PLAN.md for the work and assets/ASSETS.md for the brand kit and photos.

## Who and what

- Client: Rudrika by Tara (brand "Rudrika", trademarked), saree boutique, Kochi. Owner Tara George (Dan calls her Thara). Store: Rudrika (Texra Trends Building), Amulya Street, Banerji Road, Ernakulam, Kerala 682018. contact@rudrika.in, +91 96496 41985, WhatsApp 919649641985, Instagram rudrika.by.tara.
- Agency: Ryzenforge (always spelled exactly "Ryzenforge"), Kochi. Dan (Dhanush Sankar Sathya) is the founder and the person you are working with.
- Current site: rudrika.in on Shopify (Epilogue font, deep maroon #4B0307). The new site replaces it. Everything on it was scraped on 11 Sep 2026 into data/ (56 products, 177 variants, 10 collections, pages, policies, 9 blog posts).
- Deliverable: a custom-built e-commerce platform (Option B in docs/Rudrika_proposal_05092026.pdf) governed by docs/Rudrika_By_Tara_Project_Agreement_and_NDA.pdf. Build it from the in-house Quppayam Next.js template (skill: ecommerce-client-build), rebrand and extend, never from scratch.

## Scope (from the signed agreement, section B)

Phase 1, in scope:
1. Storefront with home, collections, shop with filters, product pages with variants, cart, checkout, order confirmation, order tracking, account, blog ("Letters from Tara"), styling page, FAQ, contact, policies.
2. Reviews and ratings with admin moderation.
3. Customer wearing-photo uploads with admin approval; an approved photo earns a one-time 2% coupon for the customer's next order.
4. Loyalty points programme (earn on delivered orders, redeem at checkout, tiers) and a paid membership ("Rudrika Circle" subscription).
5. GST invoicing with HSN codes, CGST/SGST for Kerala and IGST for other states, sequential invoice numbers, printable/PDF, GST report export. Prices are GST-inclusive.
6. Customer data capture: name, phone, email, address on every order, WhatsApp opt-in, CSV export.
7. Auto-generated unique SKUs for every product and variant, printable barcode labels.
8. Admin dashboard: orders with status flow, products and stock, customers, reviews, photos, loyalty, membership, coupons, banners and content, analytics, staff roles.
9. Razorpay payment gateway (separate add-on, agreed).
10. Hosting on a Ryzenforge VPS.

Phase 2 (after go-live): WhatsApp automation on Meta Business Suite (order confirmation, packed, shipped, delivered, feedback follow-up asking for a wearing photo, photo reward message, welcome). Wire the hooks now, switch on later.
Phase 3: Store Manager service (Ryzenforge staff run the store), so the admin needs a "Store Manager" role.

Out of scope, do not build or mention to the client: Amazon/Flipkart/Myntra marketplace sync, courier API integration (Shiprocket stays manual, link to rudrika.shiprocket.co/tracking), cash on delivery, photography and copywriting, ongoing data entry. SEO is a separate Ryzenforge service: never write the word SEO in anything client-facing. Internal SEO hygiene (slugs, redirects, metadata) is fine.

## Brand (official kit on Playbook: https://www.playbook.com/s/itsalishadesigns/DHfKv6rTtQv4inWqSsf28nSc)

- Rudrika is trademarked. The TM mark must appear next to the logo everywhere the logo appears (header, footer, invoices, labels, emails, og image). Use the digital logo files from the Playbook "Digital Logo" folder once Dan drops them into assets/brand/. Until then, the current site's logo files are listed in assets/ASSETS.md.
- Colours (from the kit): Soft Ivory #fff7f0 and Warm Gold #c4a580 (primary), Deep Maroon #471113 and Midnight Blue #0e0f1e (secondary), Sunset Orange #f47631, Terracotta Flame #f26422, Heritage Red #d44827 (accents). Template slots: cream = Soft Ivory, sand = a shade between ivory and gold (#f6ebe0), ink = Midnight Blue, clay = Deep Maroon (dark #2f0a0c, light #6a1a1e), gold = Warm Gold (light #dcc4a6, dark #9c7d55). Use the orange/red accents sparingly: sale flags, the announcement bar, one CTA at most.
- Fonts (from the kit): Cormorant Garamond (display), Proxima Nova (body, commercial font: use it only if Dan confirms an Adobe Fonts licence, otherwise Jost), Great Vibes (script, accents only, use rarely).
- Prototype look that Dan approved on 11 Sep 2026 (prototype/): ivory page, deep maroon header band and footer, gold hairlines, Cormorant Garamond headlines, Jost body. Keep that structure, swap in the kit colours and the TM logo.
- Photography: 28 new campaign photos in assets/photos/ (see the manifest). Use them for the hero, collection tiles and editorial blocks. Product images come from the scraped catalogue.

## Data you have

- data/DATA.json: products (expanded, with generated SKUs, HSN, GST, care text, images as rudrika.in CDN URLs), collections, content (brand copy, contact, pages, policies, blog), plus SAMPLE customers, orders, reviews, photos, coupons, loyalty rules, subscription, staff, notifications, settings. The sample records are demo data for the prototype only; never import them into a client database. Import products, collections and content only.
- data/content.json: the scraped site content on its own.
- data/rudrika-products-skus.csv: the SKU sheet for Tara to review.
- data/catalogue-batches/: raw scraped rows (positional: id, handle, title, type, tags, published, description, options, variants "title^price^compare^available^legacySku", image tokens).
- Blog and product copy is Tara's own text, keep it verbatim (it contains her em dashes; that is fine for her content).

## Rules that apply to everything

- SKU scheme: RUD-<FABRIC>-<0000>-<VV>. Fabric codes: SLK Silk, BAN Banarasi and Georgette, TUS Tussar Silk, LIN Linen, COT Cotton, KOT Kota Doria. Product numbers run from 0001 in publish order; new products take the next number; variant numbers 01, 02... Keep the 17 legacy Shopify SKUs (RUD-APP-SAR-00xx) in a legacy field.
- GST defaults to confirm with Tara's CA before go-live: 5% on all sarees, HSN 5007 (silk, tussar, banarasi/georgette), 5208 (cotton, kota doria), 5309 (linen). GSTIN is a placeholder in settings until she provides it.
- Shipping: flat Rs. 150 per saree, free above Rs. 4,999, accessories Rs. 80, India only, dispatch 1 to 2 working days, delivery 5 to 7 working days. Returns only for defects or transit damage, with an unboxing video, within 24 hours of delivery.
- Money is INR in integer paise in the template. Display "Rs. 12,500" style, en-IN grouping.
- Writing: no em dashes in anything we write, no icons or emojis in content, sentence case, plain verbs. Client-facing text is minimal and direct.
- Secrets: never paste .env contents, API keys or tokens into chat. Keys go into .env on the machine or server only. Anything pasted in chat is treated as compromised.
- Database: on any database with real orders, never run seed, db push, migrate reset or setup. Schema changes are additive SQL (ADD COLUMN IF NOT EXISTS) with a pg_dump first.
- Do not defer work to "later" or split into sessions on your own; work through the plan and stop only for the decisions listed in it.

## Status on 11 Sep 2026

Done: agreement signed and sent; catalogue and content scraped; single-file HTML prototype of storefront and admin approved by Dan (prototype/rudrika-by-tara-website.html, screenshots in prototype/screenshots/).
Pending from the client: TM logo files and brand guidelines (Playbook), GSTIN, Razorpay account and test keys, WhatsApp Business API access (Meta Business account), domain access for rudrika.in (currently Shopify), Owner account name and email, staff list.
Pending from Ryzenforge: VPS provisioning, portfolio examples for Tara (Dan sends separately), Figma copy of the agreement (paused, unrelated to this build).
