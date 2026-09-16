# Taking Quppayam Boutique Live

Follow these steps in order. Budget about an hour. Nothing here needs coding.

---

## Step 1 — Create a production database (10 min)

SQLite (the local file) is great for testing but not for a live site. Use free Postgres:

1. Go to **https://neon.tech** (or supabase.com) and sign up.
2. Create a project → copy the **connection string**. It looks like:
   `postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require`
3. In `prisma/schema.prisma`, change **one line**:
   ```
   provider = "sqlite"     →     provider = "postgresql"
   ```

## Step 2 — Deploy to Vercel (15 min)

1. Create a free account at **https://vercel.com**.
2. Push this project to GitHub (or drag-and-drop the folder in Vercel's importer).
3. In Vercel → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string from Step 1 |
   | `SESSION_SECRET` | any long random string (40+ characters) |
   | `RAZORPAY_KEY_ID` | from Razorpay dashboard (see Step 3) |
   | `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |

4. Click **Deploy**. Your site goes live at `something.vercel.app`.
5. Set up the database tables — in Vercel, open the project's terminal or run locally with the production `DATABASE_URL`:
   ```
   npx prisma db push
   npm run seed
   ```

## Step 3 — Turn on real payments (10 min)

1. Log in at **https://dashboard.razorpay.com**.
2. **Settings → API Keys → Generate Live Key**. (Test keys first if you want to rehearse.)
3. Paste the Key ID and Key Secret into Vercel's environment variables (Step 2) and redeploy.
4. Place one small real order yourself to confirm money arrives.

> Until Razorpay keys are set, checkout runs in **mock mode** — orders are created but no money moves. Perfect for testing, not for going live.

## Step 4 — Point quppayam.com at the new site (15 min + DNS wait)

1. Vercel → project → **Settings → Domains → Add** → type `quppayam.com`.
2. Vercel shows you DNS records. Log in wherever the domain is registered (GoDaddy, Hostinger, etc.) and add them.
3. Wait 10 minutes – 24 hours for DNS to spread. HTTPS is automatic.

> Keep the old site running until the new one is confirmed working, so the business never goes dark.

## Step 5 — Before you announce it

- [ ] **Change the admin password.** Register a fresh account with the owner's email, then in the database set that user's `role` to `ADMIN`, and delete the seeded `admin@quppayam.com` account.
- [ ] Delete the demo customer (`demo@example.com`).
- [ ] Upload real product photos through **Admin → Products** (the seeded ones currently load from the old site).
- [ ] Check every page on a phone.
- [ ] Place a test order end-to-end and confirm the confirmation email/WhatsApp flow.
- [ ] Update contact numbers in **Admin → Settings** if anything changed.

---

## Image uploads on Vercel — important

Vercel's servers don't keep uploaded files permanently. Two options:

**Option A (easiest, free):** upload photos to a free image host (Cloudinary, imgbb, or even a public Google Drive/Instagram CDN link) and paste the link into the "…or paste a link" box in the admin.

**Option B (best, ~2 min setup):** In Vercel, enable **Blob storage** and I can switch the upload code to use it — then uploads work permanently from the admin panel with no extra steps.

Ask for Option B before launch if the client wants to upload photos herself, which is likely.

---

## What the client can edit herself (no code)

| What | Where |
|---|---|
| Homepage blocks, order, hide/show | Admin → **Homepage** |
| Hero design (4 templates), text, photos, buttons | Admin → Homepage → edit the Hero block |
| Banners, product rows, video, trust strip | Admin → Homepage → edit or add a block |
| Products, prices, sizes, stock, measurements, photos, videos | Admin → **Products** |
| Categories + their photos | Admin → **Categories** |
| Customer reviews on the homepage | Admin → **Testimonials** |
| About / Shipping / Returns / Privacy / Terms wording | Admin → **Website Pages** |
| Phone numbers, addresses, logo, top-bar messages | Admin → **Settings** |
| Discount codes | Admin → **Coupons** |
| Orders & their status | Admin → **Orders** |
