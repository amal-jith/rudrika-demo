# Quppayam Boutique — Developer Handoff

## Stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 14.2** (App Router, React Server Components) |
| Language | **TypeScript** (strict off) |
| UI | **React 18** + **Tailwind CSS 3.4** (no component library) |
| ORM | **Prisma 5.22** |
| Database | **SQLite** in dev → **PostgreSQL** in production (one-line switch) |
| Auth | Custom — HMAC-SHA256 signed session cookie + **bcryptjs**. No NextAuth. |
| Payments | **Razorpay** Orders API + server-side signature verification |
| Images | `next/image`, `unoptimized: true` |
| Uploads | Local disk `public/uploads` via a route handler |
| Build | `next build` — no Docker, no custom server |

Node 18+ (20 recommended). Package manager: npm.

---

## Commands

```bash
npm install        # installs + runs `prisma generate` via postinstall
npm run setup      # prisma db push && tsx prisma/seed.ts
npm run dev        # localhost:3000
npm run build      # production build
npm start          # production server
npm run seed       # re-seed only
```

---

## Environment variables

```env
DATABASE_URL="file:./dev.db"        # dev; use the Postgres URL in production
SESSION_SECRET="long-random-string" # signs the auth cookie
RAZORPAY_KEY_ID=""                  # empty = mock checkout (no money moves)
RAZORPAY_KEY_SECRET=""
NEXT_PUBLIC_SITE_URL="https://quppayam.com"   # used in WhatsApp share links
```

> **Payment behaviour:** if the Razorpay vars are empty the checkout runs in *mock mode* — orders are created and stock decremented, but no payment is taken. Fill both keys and it automatically switches to real Razorpay Checkout.

---

## Deploying (Render / Vercel / any Node host)

1. **Database** — in `prisma/schema.prisma` change:
   ```prisma
   datasource db { provider = "postgresql" }   // was "sqlite"
   ```
   Point `DATABASE_URL` at Postgres (Render Postgres, Neon, Supabase — all fine).

2. **Render settings**
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm start`
   - Add all env vars above.
   - After first deploy, run once: `npx prisma db push && npm run seed`

3. **Vercel** works with zero config (`npm run build` auto-detected). Same env vars.

4. **Important — file uploads.** Admin image/video uploads write to `public/uploads`, which is **ephemeral** on Render's free tier and on Vercel. For production choose one:
   - Attach a **Render persistent disk** mounted at `/opt/render/project/src/public/uploads`, **or**
   - Swap `app/api/admin/upload/route.ts` to push to S3 / Cloudflare R2 / Vercel Blob (single file to change), **or**
   - Paste external image URLs in the admin (every upload field also accepts a link).

---

## Project structure

```
app/
  page.tsx                 homepage — renders CMS blocks in order
  products/                catalogue + product detail
  cart/ checkout/ orders/  purchase flow
  account/                 customer dashboard (orders, wishlist, addresses, profile)
  admin/                   admin panel (see below)
  p/[slug]/                CMS-driven content pages
  api/
    auth/{login,register,logout}
    checkout/  checkout/verify        Razorpay create + verify
    coupons/validate
    wishlist/  reviews/
    admin/upload                      image & video upload
components/                UI components (home/ = homepage blocks, admin/ = editors)
lib/
  db.ts            Prisma singleton
  auth.ts          session cookie sign/verify, getUser, requireAdmin
  razorpay.ts      order creation + HMAC signature check
  admin-actions.ts server actions for all admin CRUD
  account-actions.ts server actions for the customer dashboard
  section-types.ts homepage block schema (drives the admin forms)
  hero-templates.ts 15 hero designs (layout + palette tokens)
  store-config.ts  fallback store details
  settings.ts      merges DB settings over store-config
prisma/
  schema.prisma    data model
  seed.ts          seeds admin, catalogue, homepage blocks, reviews
  catalogue.ts     24 real products imported from quppayam.com
```

---

## Data model (Prisma)

`User` · `Address` · `Category` · `Product` · `Variant` (size + stock + optional price override) · `Order` · `OrderItem` · `Coupon` · `Review` · `Wishlist` · `Setting` · `HomeSection` · `Testimonial` · `Page`

Notes:
- Money is stored in **paise** (integers). `formatINR()` in `lib/utils.ts` renders it.
- `Product.images` / `Product.videos` are **JSON string arrays**.
- `HomeSection.data` is a **JSON blob**; its shape is declared per block type in `lib/section-types.ts`, which also generates the admin form fields.
- Order numbers are assigned in the checkout transaction (SQLite has no non-PK autoincrement).

---

## Admin panel (`/admin`)

Seeded login: `admin@quppayam.com` / `admin123` — **change before launch.**

Dashboard · Orders · Products (variants, stock, measurements, fabric, images, videos, per-product Reviews) · Categories · Homepage builder (drag-reorder blocks, 15 hero designs) · Website Pages (create/edit/duplicate) · Testimonials · Coupons · Product Reviews · Customers · Settings (logo, phones, branch addresses, announcement bar).

Access control: `requireAdmin()` in `lib/auth.ts`; `/admin/layout.tsx` redirects non-admins.

---

## Pre-launch checklist

- [ ] Switch Prisma provider to `postgresql`, run `db push` + `seed`
- [ ] Set `SESSION_SECRET` to a long random value
- [ ] Add live Razorpay keys, place one real test order
- [ ] Sort out persistent upload storage (see above)
- [ ] Create a new admin account, delete the seeded `admin@quppayam.com` and `demo@example.com`
- [ ] Replace seeded product photos (they currently hotlink `quppayam.com`) with uploads on the new host
- [ ] Point the domain, verify HTTPS
- [ ] Check checkout end-to-end on a real phone

---

## Known follow-ups (not built)

- Google / email OTP / WhatsApp OTP login — needs OAuth credentials, an email provider, and Meta WhatsApp Business approval respectively
- Transactional emails (order confirmation) — no provider wired yet
- Shipping-partner / tracking-number integration
