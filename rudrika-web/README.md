# Rudrika by Tara, store build

Next.js 14 (App Router), Tailwind, Prisma, PostgreSQL, Razorpay and the WhatsApp Cloud API. Storefront and admin in one app. Built by Ryzenforge from its in-house boutique template and extended for Rudrika. The full developer handoff is in ../docs/HANDOFF.md.

## Run locally (fresh database only)

Requirements: Node 20+, PostgreSQL 15+.

```bash
cp .env.example .env         # fill DATABASE_URL and SESSION_SECRET at least
createdb rudrika_dev
npm install
npx prisma generate          # needed where npm blocks install scripts
npx prisma db push
npm run seed                 # admin account, settings, homepage, then the Rudrika catalogue
npm run dev                  # http://localhost:3000, admin at /admin
```

The seed creates the admin from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD. If the password is blank it prints a random one to the terminal once. It never changes the password of an admin that already exists.

`npm run seed` also runs scripts/import-rudrika.ts: 6 fabric categories, 10 collections, 56 products with 177 variants (SKUs, HSN, GST rate, care text, local images under public/uploads/products), and the 9 Letters from Tara. It is idempotent, so running it again updates rather than duplicates.

Never run seed, db push, migrate reset or setup against a database that holds real orders. Use scripts/migrate-rudrika.sql (additive SQL) after a pg_dump.

## Other commands

```bash
npm run build && npm start   # production
npm run typecheck            # tsc
npm run reminders            # daily WhatsApp reminders and birthday points (cron)
```

## Payments and WhatsApp

Blank Razorpay keys keep checkout in mock mode. Put test keys in .env, restart, and checkout opens the real Razorpay window; signatures are verified in app/api/checkout/verify. Blank WhatsApp keys keep every message queued and visible in Admin, WhatsApp, with a resend button for once the Meta keys are in.

## Where things live

- lib/store-config.ts: contact details, shipping and returns copy, GST state and invoice prefix.
- lib/settings.ts: settings editable from Admin, Settings (GSTIN, invoice numbering, loyalty rules, Rudrika Circle, photo coupon, WhatsApp switches).
- lib/permissions.ts: the role matrix (ADMIN, MANAGER, STORE_MANAGER, STAFF, CUSTOMER).
- lib/sku.ts, lib/gst.ts, lib/loyalty.ts, lib/whatsapp-events.ts: the Rudrika modules.
- ../docs/TEMPLATE-MAP.md: the route and model map.
