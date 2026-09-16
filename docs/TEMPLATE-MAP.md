# Store build map (rudrika-web)

Where things live in rudrika-web after the final build on 13 Sep 2026. The base was
Ryzenforge's boutique template (the complete 12 Aug 2026 snapshot); everything marked
Rudrika below is net-new for this client.

Stack: Next.js 14 (App Router), Prisma, PostgreSQL, Razorpay, WhatsApp Cloud API.
Money is integer paise; display is "Rs. 12,500". Prices are GST inclusive.

## Storefront routes (app/)

- `/` home (CMS sections from HomeSection, seeded for Rudrika), `/products` (fabric, in stock,
  on offer, pre-order, price band filters, sort, search incl. tags), `/products/[slug]`
  (variants, video, Silk Mark, care, pre-order, Wearing Rudrika photos, reviews)
- `/collections`, `/collections/[handle]` (Rudrika), `/letters`, `/letters/[slug]` (the blog)
- `/gallery` Wearing Rudrika wall (approved customer photos plus admin stories)
- `/cart`, `/checkout` (WhatsApp opt-in, loyalty points, member discount), `/orders/[id]`
- `/track` public order tracking by number and phone (Rudrika)
- `/account` with `/orders` (+ `[id]/invoice` GST invoice), `/loyalty`, `/circle`, `/photos`,
  `/wishlist`, `/addresses`, `/profile`; `/login` (supports ?next=), `/register` (phone + opt-in)
- `/about` (edited from Admin, Pages), `/contact`, `/faq`, `/size-guide` (saree guide),
  `/p/[slug]` CMS pages incl. `/p/styling`; `/shipping-policy`, `/returns`, `/privacy-policy`,
  `/terms` redirect to their `/p/` pages. `/sitemap.xml` and `/robots.txt` are generated.
- Old Shopify paths redirect in next.config.mjs (collections, blogs, pages, policies, the three
  renamed "untitled" product handles).

## Admin routes (app/admin/)

dashboard, `orders` (+ `[id]` with courier/AWB, timestamps, invoice, send feedback; `[id]/invoice`),
`products` (+ `new`, `[id]`, `[id]/reviews`), `stock`, `reports`, `users` (staff), `categories`,
`collections` (Rudrika), `coupons`, `customers` (phone, opt-in, points, tier, Circle, CSV),
`reviews`, `photos` (Rudrika, approve issues the 2% coupon), `loyalty` (Rudrika), `membership`
(Rudrika Circle), `whatsapp` (Rudrika, log and resend), `labels` (Rudrika, barcode sheets),
`invoices` (Rudrika, GST report CSV), `blog` (Letters from Tara), `testimonials`, `gallery`,
`homepage`, `pages`, `shipping`, `settings` (GST, loyalty, membership, WhatsApp switches).

## API routes (app/api/)

`checkout`, `checkout/verify`, `membership` (Rudrika), `loyalty/me` (Rudrika), `photos`
(Rudrika upload), `coupons/validate` (customer-bound and single-use aware), `reviews`, `wishlist`,
`auth/{login,logout,register}`, `admin/upload`, `admin/orders/export`, `admin/products/export`,
`admin/customers/export`, `admin/gst-report` (all CSV).

## Prisma models

User (phone, whatsappOptIn, birthday, loyaltyPoints, lifetimeSpend, tier, membershipExpiresAt,
role, active), Address, Category, Product (productCode, hsn, gstRate, silkMark, preorder,
earlyAccess, care, tags, collections), Variant (sku, legacySku, colour), Collection, Post,
ShippingZone, GalleryStory, Order (invoiceNumber/Date, packed/shipped/deliveredAt, courier, awb,
pointsRedeemed, pointsValue, membershipDiscount, whatsappOptIn), OrderItem (sku, hsn, gstRate,
preorder snapshot), Coupon (customerId, singleUse), Review, Wishlist, Setting, HomeSection,
Testimonial, Page, LoyaltyLedger, CustomerPhoto, Membership, WhatsAppLog.

Live databases get scripts/migrate-rudrika.sql (additive) after a pg_dump, never db push.

## Key lib files

- `lib/store-config.ts` contact, branch, shipping and returns copy, GST state and prefix
- `lib/settings.ts` getStore() plus RUDRIKA_DEFAULTS and getRudrikaSettings()
- `lib/auth.ts` sessions (cookie rud_session); `lib/permissions.ts` role matrix and areas;
  `lib/admin-guard.ts` guardPage(area) for pages, requireCan(area) for actions
- `lib/sku.ts` RUD-<FABRIC>-<0000>-<VV>, ensureSkus(productId) on every product save
- `lib/gst.ts` gstBreakup (CGST/SGST inside Kerala, IGST elsewhere), assignInvoiceNumber
- `lib/loyalty.ts` addPoints, tiers, earnForDeliveredOrder, redemption cap, membership
- `lib/whatsapp-events.ts` sendEvent per event with settings switches and WhatsAppLog;
  `lib/notify.ts` the Meta Cloud API client
- `lib/rudrika-actions.ts` photo review, points adjust, membership grant, posts, collections
- `lib/admin-actions.ts` products (with SKUs), orders (status flow, invoice, WhatsApp, points)
- `lib/search.ts`, `lib/utils.ts` (formatINR "Rs.", ORDER_STATUSES incl. PACKED, shipping)
- `components/GstInvoice.tsx` shared printable GST invoice (admin and customer)
- `scripts/import-rudrika.ts` catalogue import from data/DATA.json;
  `scripts/whatsapp-reminders.ts` daily cron (feedback, renewal, birthday)
