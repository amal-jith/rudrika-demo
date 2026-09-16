# Rudrika by Tara, developer handoff

Prepared by Ryzenforge on 13 Sep 2026, final build. Two things are handed over: the approved
design (a static multi-page site for client review) and the store build (the Next.js platform
that is hosted and handed to the client). Read CLAUDE.md and docs/BUILD-LOG.md for history.

## 1. The design site (client review)

Folder: landing-concepts/rudrika-site/ (14 pages, shared images in img/, films in media/).
Open index.html directly, or serve the folder:

    cd landing-concepts && python3 -m http.server 8080
    http://localhost:8080/rudrika-site/index.html

Content lives in landing-concepts/src/build_rudrika_site.py (PRODUCTS, VIDEOS, REELS, LETTERS,
NAV). Rebuild after any change with `python3 landing-concepts/src/build_rudrika_site.py`
(needs Python 3 and Pillow). Paste Tara's Instagram reel links into REELS; they render as
official embeds. The films play muted in small frames; the sound button unmutes them.

## 2. The store build

Folder: rudrika-web/. Map of routes, models and libs in docs/TEMPLATE-MAP.md. Quick start in
rudrika-web/README.md.

Run it locally (fresh database only):

    cd rudrika-web
    cp .env.example .env        # DATABASE_URL, SESSION_SECRET; the rest can stay blank
    createdb rudrika_dev
    npm install && npx prisma generate
    npx prisma db push && npm run seed
    npm run dev                 # http://localhost:3000, admin at http://localhost:3000/admin

Admin login: the seed creates the account from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.
With the password blank it prints a random one to the terminal once. On Dan's Mac the admin is
admin@rudrika.in and the password is in rudrika-web/ADMIN-LOGIN.local.txt (not in the zip, not
in git). There is no demo admin and no demo catalogue any more.

The seed loads: settings, shipping zone (India, Rs. 150 per saree, free above Rs. 4,999), the
homepage sections with the campaign photos, the six policy and content pages, then the Rudrika
catalogue from data/DATA.json (6 fabric categories, 10 collections, 56 products, 177 variants
with SKUs, 9 Letters from Tara). Images are already downloaded under
public/uploads/products/<handle>/, so nothing depends on the Shopify CDN.

Never run seed, db push, migrate reset or setup on a database with real orders. Schema changes
on a live database are scripts/migrate-rudrika.sql (additive) after a pg_dump.

## 3. What is built (agreement section B, Phase 1)

Storefront: home (CMS sections), shop with filters (fabric, in stock, on offer, pre-order, price
band, sort, search including tags), product pages (variants, video, Silk Mark, care, pre-order,
Wearing Rudrika photos, reviews), collections, Letters from Tara, Wearing Rudrika wall, cart,
checkout (name, phone, email, address, WhatsApp opt-in, coupon, points redemption, member discount
and free shipping), order confirmation, public tracking at /track, account (orders with GST
invoice, loyalty points, Rudrika Circle, photos and coupons, wishlist, addresses, profile), about,
styling, saree guide, questions, contact, policies, sitemap and robots, redirects from the old
Shopify paths.

Admin: dashboard, orders with the PENDING, PLACED, PACKED, SHIPPED, DELIVERED, CANCELLED flow
(courier and AWB on shipping, timestamps, GST invoice, send feedback request), products and
stock (SKUs assigned automatically on save, HSN, GST rate, tags, collections, care, Silk Mark,
pre-order, early access), collections, SKU labels (barcode sheets, A4 or 50x30 mm), GST invoices
and the GST report CSV, customers (phone, opt-in, points, tier, Circle, CSV export), reviews
(approval gives points), Wearing Rudrika photos (approval issues the one-time 2% coupon bound
to that customer), loyalty points (ledger and manual adjustments), Rudrika Circle (grant, end),
WhatsApp log with resend, Letters from Tara editor, coupons, testimonials, gallery stories,
homepage builder, pages, shipping zones, settings (GSTIN, invoice numbering, loyalty rules,
membership price and benefits, photo coupon percent, WhatsApp switches), staff with roles
ADMIN, MANAGER, STORE_MANAGER (the Ryzenforge service role) and STAFF.

GST: prices are inclusive; the invoice splits taxable value and CGST/SGST inside Kerala or IGST
for other states, per line with HSN, and numbers invoices RUD/26-27/0001 onwards when payment
is confirmed. Membership is sold as an order line (SKU RUDRIKA-CIRCLE, HSN 9997, 18%).

Verified on 13 Sep 2026 with a production build: every storefront and admin route returns 200,
registration with welcome points, a mock order redeeming points, a guest order matched to a new
customer record, invoice numbers in sequence, the status flow to DELIVERED earning points, photo
upload and approval issuing a coupon that only its owner can use once, a member order with the
5% discount and free shipping, the GST CSV, barcode labels and tracking.

## 4. Switch on later (agreed with the client, after this build)

Razorpay: put RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env on the server and restart. Checkout
and Rudrika Circle then use the real Razorpay window; verification is in app/api/checkout/verify.
Place a Rs. 1 test order and refund it before going live.

WhatsApp (Phase 2): put WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ADMIN_NUMBERS and the
approved template names in .env. Until then every message is logged as queued in Admin,
WhatsApp, with the text it would have sent and a resend button. Add the daily cron for follow-ups:

    0 10 * * * cd /var/www/rudrika/app && npm run reminders >> logs/reminders.log 2>&1

GSTIN: enter it in Admin, Settings when Tara provides it. Confirm HSN and the 5% rate with her CA.

## 5. Host and hand over (Phase 5 checklist)

- VPS: Ubuntu 24.04, Node 20+, PostgreSQL, nginx, pm2, ffmpeg. Database and a dedicated DB user.
- Copy rudrika-web to /var/www/rudrika/app. Write .env on the server (never in chat).
  `npm install && npx prisma generate && npx prisma db push && npm run seed` on the empty
  database, then `npm run build` and `pm2 start npm --name rudrika -- start`.
- Nightly pg_dump and weekly backup of public/uploads, confirmed before content goes in.
- Domain: move rudrika.in and www from Shopify to the VPS, SSL with certbot, redirect map live.
- Owner account for Tara, staff accounts, a STORE_MANAGER account for Ryzenforge. Switch off the
  seeded admin after the Owner account exists.
- Tara reviews the SKU sheet (data/rudrika-products-skus.csv), stock counts and policy text.
- Product page checked on an actual phone. OS patched and rebooted before handover.
- Hand over: admin URL and Owner login, a short note on Settings and adding staff, what the
  client can change herself versus what needs a developer, where backups live.

Still needed from the client: GSTIN, Razorpay account and keys, WhatsApp Business API access,
domain access for rudrika.in, the Owner account name and email, the staff list, Instagram reel
links, full-resolution campaign photos.

Rules for anything written for the client: no em dashes, no icons or emojis, sentence case,
the word Ryzenforge spelled exactly, never the word SEO in client-facing text.
