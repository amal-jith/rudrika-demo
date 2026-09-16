# Rudrika by Tara, build log

A running log of what changed each phase and what is next. Newest first.

## 2026-09-13, final build: Phases 2 to 4 in rudrika-web, plus the design site fixes

Dan's request: fix the heart icon and the sound button on the design site, then build everything in
the agreement into the store (SKUs, product controls, CMS, GST, loyalty, membership, photos, WhatsApp
hooks) except live Razorpay keys and the WhatsApp switch-on, which follow after this build. Everything
delivered in one zip.

Design site: one shared heart SVG on cards, product page, header and account; the sound button
unmutes, sets volume, shows controls and restarts playback. Rebuilt the 14 pages.

Store build, rebrand (Phase 2): brand kit colours and fonts, TM logo (maroon on light, white on dark),
lib/store-config.ts, page defaults, hero slides, homepage seed, metadata, cookie name, redirects from
the old Shopify paths, footer, header, mobile bar, about, contact, questions, saree guide, Wearing
Rudrika gallery. Every template phrase, category and image reference replaced; no Quppayam text,
data or images remain (grep on app, components, lib, prisma, scripts is clean). Rupee glyphs, arrows,
stars, ticks and em dashes replaced with "Rs.", words or line icons.

Catalogue (Phase 3): scripts/fetch-rudrika-images.js downloaded 224 product images to
public/uploads/products; scripts/import-rudrika.ts imports categories, collections, products,
variants (SKUs, legacy SKUs, HSN, GST, care, tags, Silk Mark, pre-order) and the 9 letters; the seed
calls it. Three Shopify "untitled" handles got real slugs with redirects.

Modules (Phase 4): schema additions (User loyalty and membership fields, Product and Variant SKU and
GST fields, Order invoice and tracking fields, Coupon customerId and singleUse, LoyaltyLedger,
CustomerPhoto, Membership, WhatsAppLog, Collection, Post) with scripts/migrate-rudrika.sql for live
databases. lib/sku.ts, lib/gst.ts, lib/loyalty.ts, lib/whatsapp-events.ts, lib/rudrika-actions.ts.
Admin pages: collections, labels, invoices and GST CSV, photos, loyalty, membership, whatsapp, blog,
settings groups, customers columns and CSV, products export, order page with courier, AWB and
timestamps. Storefront: collections, letters, track, filters, pre-order, account loyalty, circle and
photos pages, photo upload API, shared GstInvoice for admin and customer, coupon rules, register
with phone and opt-in, login ?next=, sitemap and robots. STORE_MANAGER role in the matrix.
scripts/whatsapp-reminders.ts for the daily cron (feedback after 5 days, renewal 14 days before
expiry, birthday points).

Checked: typecheck clean, production build clean. Against the production server: 34 storefront and
34 admin routes return 200 (admin redirects to login without a session, APIs return 401);
registration gives 50 welcome points and queues the welcome message; a mock order redeeming 20
points (Rs. 200) gets invoice RUD/26-27/0001 with CGST and SGST; a guest order from Karnataka gets
IGST and a new customer record; PACKED, SHIPPED (courier and AWB) and DELIVERED stamp their times
and delivery earns 10 points; membership join creates order 1003 with the RUDRIKA-CIRCLE line at 18%
and activates a year; photo upload needs consent, approval creates WEAR-SMOKE-XXXX (2%, single use,
bound to the customer), which a guest cannot use (401), another account cannot use (403), and which
deactivates after the member order (5% off plus free shipping); the GST CSV, label sheet, tracking
page, sitemap (90 URLs), robots and redirects all verified. WhatsApp messages log as QUEUED with
"Waiting for WhatsApp connection" until the keys are in.

Local test data: the orders, users and coupon above live only in rudrika_dev on Dan's Mac; the
developer's database starts clean from the seed.

Deliverable: Rudrika-final-build-2026-09-13.zip (everything except node_modules, .next, .env and
ADMIN-LOGIN.local.txt). Admin: http://localhost:3000/admin, admin@rudrika.in, password in
rudrika-web/ADMIN-LOGIN.local.txt on Dan's Mac.

Pending after this build (agreed): live Razorpay keys, WhatsApp switch-on and template approval,
GSTIN from Tara, hosting and domain move (Phase 5 checklist in docs/HANDOFF.md).

## 2026-09-12, final design pass: one page per menu item, reels, functional, mobile (Dan's request)

Dan's corrections: he opened rudrika-landing-nalli.html and it still carried the "Onam edit" and a
product grid, which I had only removed from the four-page site. He wants every menu item as its own
page, nothing from Quppayam (a separate company; only its functionality was ever the inspiration),
no "Onam edit", products built from Tara's Instagram reels, an Instagram-reels feature on the home
page, every button functional, mobile optimised, rich colours with no white-edited images, and the
agreement verified so the agreed features are visibly represented.

Agreement check: extracted the signed agreement text (pypdf) and mapped Sections B1 and B2 to the
design. Customer-facing features now each have a page or control; admin-only ones (stock control,
analytics, permissions, SKUs and labels) are marked as store-build items. Section B3 exclusions
(marketplaces, courier API, cash on delivery, photography and copywriting) are not promised anywhere.

Reels: Tara's Instagram is login-walled and her reels are not indexed by search, and her current site
links only the profile, so no reel permalinks could be discovered. No links were fabricated. The reels
feature is fully wired with the official Instagram embed: paste her reel links into the REELS list in
the builder and they render on the home page; product entries each carry a reel slot too. Until then
the reels section shows her campaign posters that link to her Instagram reels.

Built landing-concepts/rudrika-site/ from landing-concepts/src/build_rudrika_site.py, 11 pages:
index (rotating hero, reels, weaves, new arrivals, unique pieces, Teera, letters, newsletter),
collections, products (weave filters read from ?cat=, live search, colour variants, wishlist, add to
bag, WhatsApp enquiry per saree, watch-reel link), arrivals, styling (booking on WhatsApp, wearing
photo reward), letters, about, contact (form that opens a prefilled WhatsApp message, Google Maps
link, FAQ), account (orders, wishlist, loyalty points, Rudrika Circle, my photos, profile), track
(status timeline, Shiprocket link) and features (the agreement checklist with links). Bag and
wishlist persist in localStorage with live header counts; the bag drawer sends the list to Tara on
WhatsApp. Product entries are Tara's own campaign photos named by weave and colour, free size, price
on enquiry; no catalogue names, prices or CDN product images.

Images: regenerated all 32 creatives as rich (modest shadow lift, colour and warmth, soft vignette,
no ivory dissolve), overwriting every white-edited version.

Checked: static scan of all 11 pages (no unresolved tokens, no Quppayam, no Onam, no em dashes, no
SEO, every local link target exists); runtime checks in the browser on desktop and a 375px phone
viewport (rotating hero, reels, bag and wishlist handlers, filters and search, no horizontal
overflow, hamburger menu, no console errors); touch targets raised to 44px after the phone check
(small buttons, hero dots, bag remove link). An adversarial audit workflow (agreement coverage, data
hygiene, functionality, mobile, copy rules, each finding refuted by two independent checkers) was run
before delivery; confirmed findings are recorded below.

Deliverable: landing-concepts/rudrika-site/ (11 pages, open index.html from the folder).

## 2026-09-12, multi-page Rudrika brand site, no products, no Quppayam (Dan's request)

Dan clarified: the landing concepts and the Quppayam template are separate projects. We only take
Quppayam's features and functions as inspiration for the real build, never its data. He wants
multiple pages rather than one long landing, the campaign imagery used as heroes and banners, no
product catalogue and no borrowed campaign naming (he flagged the "Onam edit"), and heroes that can
rotate. He also pasted four new images to use.

Note: the four pasted images were not saved to disk anywhere I can read (only stale files in the
app's pending-uploads), so I could not process them as files. Built the site with the rich campaign
creatives from the same shoot; the exact four can be swapped in once saved to assets/photos.

Built a four-page site in landing-concepts/rudrika-site/ (build_site_pages.py). Shared rich theme
(warm cream, deep maroon, gold, Cormorant Garamond and Jost), a utility bar, a centred-logo header
with Home, Collections, Our story and Contact, and a footer. Pages:
- index.html: a rotating hero (three campaign shots, crossfade with dots), shop-by-weave tiles, a
  unique-pieces band, the Teera everyday block, Letters from Tara and a newsletter.
- collections.html: its own hero, shop-by-weave tiles, an exclusive-designs band and a styling block.
- story.html: hero, the brand narrative in Tara's own words, the three values, and a campaign gallery.
- contact.html: hero, store and contact details, and a message form (stubbed).

No products, no prices, no Quppayam data, no "Onam" naming, no icons, no em dashes, Ryzenforge
spelled right. Editorial and brand-led. Each page is self-contained and links to its siblings by
filename, so open them from the folder.

Deliverable: landing-concepts/rudrika-site/ (index.html, collections.html, story.html, contact.html).

## 2026-09-12, richer vibe fix + a Nalli-referenced design (Dan's request)

Dan said the Seematti hero was too white. Her current site is dark and dull; he wants a fresher but
richer vibe, not washed out. He also said Tara needs her products categorised, and asked for a
second design referencing nalli.com. Deliver two files: the fixed Seematti one and the new Nalli one.

Image fix: the earlier "airy" creatives dissolved the colour into ivory, which read washed. Made a
"rich" creative pass instead (assets/creatives/rich-*.jpg): a modest shadow lift with a colour and
warmth boost and a soft warm vignette, keeping the vibrant backdrops and depth. Bright, but rich.

1. Fixed rudrika-landing-seematti.html: hero now uses the rich red-pallu image behind a warm deep
   maroon scrim with cream and gold text (not white), the offer banner uses a rich image, and a new
   "Shop by price" band was added for categorisation (alongside the existing category pills and
   shop-by-fabric tiles).
2. New rudrika-landing-nalli.html: rich, traditional, category-forward, deeper maroon and gold
   palette. Utility bar, centred-logo header, a moody purple-pallu hero, featured products, a strong
   "Shop by category" split (two image tiles plus an all-weaves list of twelve categories with
   counts), featured collections (six tiles), shop by price (six buckets), best sellers, a heritage
   block, testimonials and a trust row. Uses the real products and Quppayam commerce features.

Checked: both served locally and reviewed. Seematti hero is now rich and warm, Nalli page renders
top to bottom with real saree photos, no console errors, no em dashes, no icons, Ryzenforge spelled
right, truthful copy (no fabricated founding year or discount sale).

Deliverables: landing-concepts/rudrika-landing-seematti.html (fixed) and
landing-concepts/rudrika-landing-nalli.html (new).

## 2026-09-12, Seematti-themed landing with real products (Dan's request)

Dan shared seematti.com as a reference and asked for a Rudrika landing themed like it, using our
Quppayam commerce features. Studied Seematti: a warm, festive Kerala silk-house homepage with a
category-pill row, a big serif hero, a featured product grid (image, name, price, offer, wishlist,
add to bag, sold out), an offer banner, a shop-by-fabric block and a trust-badge row.

Built landing-concepts/rudrika-landing-seematti.html to match that structure in the Rudrika palette
(ivory, deep maroon, warm gold, a heritage-red sale accent, Cormorant Garamond and Jost):
- Announcement bar, centred logo header with search, wishlist and bag counts, and a scrollable
  category-pill row (Offers, Silk, Banarasi and Georgette, Tussar Silk, Linen, Cotton, Kota Doria,
  New arrivals, Best sellers).
- Hero banner "Elegance woven through generations" over the airy red-pallu shot.
- Featured grid "The Onam edit, festive favourites" with 12 real Rudrika products pulled from
  DATA.json (real saree photos from rudrika.in, real prices, offer flags with strike-through compare
  prices, New flags, per-colour variant counts, wishlist and add-to-bag with live header counts).
  This is the Quppayam product surface, themed like Seematti.
- Offer band "The Onam Edit", shop-by-fabric tiles with piece counts, a five-item trust row (ships
  across India, secure Razorpay payments, free shipping above Rs. 4,999, WhatsApp support, Silk
  Mark), an our-story split, Letters from Tara, newsletter and a maroon footer. Floating WhatsApp
  button, scroll reveals, mobile menu.

Checked: served locally, hero and the full 12-card product grid and offer band render correctly with
the real saree photos, no console errors, no em dashes, no icons, Ryzenforge spelled right. Truthful
copy only (a festive "Onam edit", not a fabricated discount sale).

Deliverable: landing-concepts/rudrika-landing-seematti.html

## 2026-09-12, elevated the prototype landing directly (Dan's request)

Dan did not like the three standalone concepts (elegant, immersive, Lumora-style) and said the
approved prototype is the keeper; just make its landing better. He asked to use Higgsfield or Adobe
for something amazing. Checked both: Higgsfield is on the free plan with 0 credits and no free-trial
allowance, so it refuses every generation. Adobe is a full signed-in account and its background
removal, relight and generative-expand work, but the image tools reject local files and non-Adobe
URLs (rudrika.in is not whitelisted), so using it needs Dan to upload each photo through the Adobe
picker. Given that, and his "or just create directly," elevated the prototype landing directly.

Done (in the approved prototype style, no new design):
- Cinematic hero: slow Ken Burns zoom on the hero image, a warm-gold radial glow, the "designed for
  your story" line now shimmers in a gold gradient, a staged entrance for the headline and buttons,
  and a Scroll cue. All respect reduced-motion.
- Elegant scroll reveals across the landing (section headers, collection cards, product cards, the
  split blocks, values, letters, newsletter) via IntersectionObserver, plus a lift on collection
  cards and a slow zoom on split images on hover.
- Rebuilt prototype/rudrika-by-tara-website.html, no console errors.

Open offer to Dan: for a true media wow, cut the campaign models out of the dark backdrops onto
brand ivory using Adobe (needs him to upload 3-4 photos through the picker), then drop those in as
the hero and collection tiles. Or top up Higgsfield for a cinematic hero video from the shoot.

Deliverable: prototype/rudrika-by-tara-website.html (updated)

## 2026-09-12, new landing concept in the Lumora style (Dan's request)

Dan found the first two concepts bad and shared a reference prompt from a library (Lumora, a
studio site) with a signature liquid before/after cursor-reveal hero. He asked to build the hero
like that reference and a normal landing page for the rest, using only our own images and content,
taking the features from the prompt.

Done:
- Built landing-concepts/rudrika-landing-v2.html, a single self-contained file in the Lumora style,
  Rudrika palette (ivory, warm terracotta accent, deep maroon ink, Cormorant Garamond display,
  Onest body) and our content and photos.
- Hero reproduces the reference features: a full-screen intro loader that counts 000 to 100 and
  slides up; a full-bleed liquid cursor-reveal (moving the pointer paints a second saree photo over
  the first, canvas brush trail per the spec); a giant RUDRIKA watermark; a line-by-line headline
  reveal; a carousel hero card; an "Our weaves" grid; a live Kochi clock; a full-screen nav overlay
  and a request modal; Lenis smooth scroll (vendored and inlined).
- Rest of the page as a normal landing: About with a word reveal, a "We / Weave / arrow / Stories"
  band, a "Shop by fabric" six-tile grid, a four-row services list, a stats panel with scroll
  count-up, and a footer. Hardened so content and the loader never depend on the animation loop.
- Two hero images generated for the liquid reveal (assets/creatives/liquid-base.jpg and
  liquid-reveal.jpg). No em dashes, no icons, Ryzenforge spelled correctly.

Checked: served locally and reviewed top to bottom on desktop and mobile widths; confirmed the
liquid cursor-reveal actually paints the second image, the loader safety fallback works, and there
are no console errors. The earlier elegant and immersive files are kept for reference.

Deliverable: landing-concepts/rudrika-landing-v2.html

## 2026-09-12, re-based rudrika-web onto the latest Quppayam snapshot (Dan's request)

Dan said the GitHub repo is the latest, but neither of us could find it. It turned out to be a
private repo under the ryzenforge01-bit account (SSH auth works here, but a private repo cannot be
found by name without the exact name, and it is not in any public listing). Dan then said to use
the most recent Quppayam files on this Mac.

Found that development continued well past the v10 plus v11/v12/v15 deltas we first used. The newest
complete build is a fully assembled snapshot dated 12 Aug 2026 (through the v23 admin work), sitting
in a previous Claude session's outputs folder. It has 211 files and, crucially, the staff-role system
the plan needs: lib/permissions.ts (ADMIN, MANAGER, STAFF), lib/admin-guard.ts with guardPage and
requireCan, and admin pages for stock, reports and users that the v10 base lacked.

Done:
- Backed up the v10-based rudrika-web to the scratchpad, saved the .env, and replaced rudrika-web
  with the 12 Aug snapshot. Restored the same .env (mock checkout, rudrika_dev).
- Recreated the rudrika_dev database fresh for the new schema, npm install, npx prisma generate,
  npx prisma db push, npm run seed (24 products, 12 users across ADMIN and CUSTOMER).
- Cleared a stale dev-server and port clash, started one clean dev server on http://localhost:3000.
- Placed a mock order end to end again (order #1001, PLACED, MOCK) and confirmed /admin guards to
  login. Updated docs/TEMPLATE-MAP.md: the roles gap is now resolved, only STORE_MANAGER is left to
  add in Phase 4.

Checked: new base runs on seed data, mock order works, admin is role-guarded. Local URL
http://localhost:3000 (storefront) and /admin.

## 2026-09-13, last check, optimisation, admin access and developer handoff (Dan's request)

Done:
- Speed: the 14 pages embedded the same images as base64, 36 MB of HTML in total. Images are now
  shared files in rudrika-site/img/ (24 files, 2.4 MB, cached once) and the pages are about 50 KB
  each (756 KB in total). No data URIs remain.
- Bug found and fixed in the last sweep: the wishlist heart sits inside the product-card link, so
  tapping it also opened the product page. Clicks on wishlist, add-to-bag and slider dots now stop
  the parent link.
- Full scripted smoke test in the browser, page by page: menu, bag add and remove, drawer and
  checkout link, wishlist without leaving the page, hero slider, sound toggle on the films, weave
  filters and live search, product detail with colour chips and film, checkout with the WEAR2
  coupon and the demo pay step, all seven account tabs and the GST invoice, contact and track
  forms, letters anchors, collections links, arrivals, about, styling, policies, features. All
  27 image and film files answer HTTP 200. Zero console errors across every page.
- Store build admin: created admin@rudrika.in (ADMIN) in the local database; the password is in
  rudrika-web/ADMIN-LOGIN.local.txt (mode 600, gitignored, never in chat). Login verified against
  the running build. The seeded template demo admin is switched off locally.
- docs/HANDOFF.md written for the developer: how to render and share the design, where content
  lives, how to run the store build, admin access, done and pending, client inputs, and the
  host-and-handover checklist.

Deliverables: landing-concepts/rudrika-site/ (open index.html) and docs/HANDOFF.md.

## 2026-09-13, videos playing inline in small frames (Dan's request)

Dan: the reel videos should play in smaller frames within the website, not link out.

Done:
- Tara's own three films from her current site (the hero, new arrivals and best sellers videos on
  her Shopify CDN, all 1920 x 1080) are now hosted with the site in landing-concepts/rudrika-site/
  media/ (22 MB total, already web-encoded; no re-encode tool on this Mac).
- Home page "Sarees in motion": three small 16:9 frames in a row on desktop (389 x 219 each), a
  horizontally swipeable strip on phones (300 px frames, snap scrolling, no page overflow). Frames
  autoplay muted and loop, with a "Tap for sound" toggle; reduced-motion users get native controls
  instead. Instagram permalinks added to REELS still render as official embeds after the films.
- Product pages: sarees with a film (p1, p2, p3) show it in a small 16:9 frame with native
  controls under the saree image. Moved the frame out of the gallery box, which was clipping it.
- Removed the old 9:16 reel-card CSS that was fighting the new frames.

Checked in the browser: films decode (readyState 4), play() resolves under the muted autoplay
policy, frames are sized and unclipped on desktop, phone and the product page, zero console
errors. Note: the app's hidden preview pane pauses media, so playback was verified by geometry,
readiness and play() resolution; it plays in a normal foreground tab.

Deliverable: landing-concepts/rudrika-site/ (open index.html from the folder; media/ must stay
beside the pages).

## 2026-09-13, final design pass on the multi-page site (Dan's final-update request)

Dan's brief: a separate page for every menu item, nothing from Quppayam and no "Onam edit",
products built from Tara's Instagram reels, an Instagram reels feature on the home page, every
button functional, mobile optimised, rich colours with no white-edited images, and a check of the
agreed features against the signed agreement.

Done:
- The deliverable is landing-concepts/rudrika-site/ (14 pages, built by
  landing-concepts/src/build_rudrika_site.py): index, collections, products, product, arrivals,
  styling, letters, about, contact, account, checkout, track, policies, features. Every menu item
  is its own page and every internal link resolves (checked across all 14 pages, zero dead links,
  zero empty anchors).
- Content hygiene: a base64-stripped scan of all 14 pages finds zero Onam and zero Quppayam
  content. The only real "Onam edit" was in the earlier single-file concepts, which are now moved
  to landing-concepts/_archive/ so they cannot be opened by mistake.
- Products are 12 reel-led entries built from Tara's campaign photos with prices on enquiry (no
  scraped catalogue data). Each product carries a `reel` link slot and the home page has an
  Instagram reels block that renders official Instagram embeds once permalinks are added
  (REELS list in the builder). Instagram walls off the reels grid for logged-out visitors, so
  the permalinks need to be pasted in by Dan or Tara; until then the block shows her sarees
  linking to her reels page.
- Colours: every tile and band now uses the rich relight set (assets/creatives/rich-*.jpg,
  backdrop and depth kept). No airy or ivory-dissolved image is referenced anywhere.
- Fixes from the audit that were still live: [hidden] rule so the bag and wishlist badges stay
  hidden at zero; phone-safe grids (minmax(0,1fr)) and stacked card buttons so nothing overflows a
  375 px viewport; overflow-x clip on html and body for iOS; hero slider dots are real buttons;
  the false "woven in Kochi" claim is now "curated in Kochi" (her own bio says handloom and
  ahimsa silk) and the about page says "rooted in India's handloom traditions".
- Letters from Tara now use her verbatim titles and text from data/content.json (first three
  posts), not invented copy.
- Agreement check: docs/Rudrika_By_Tara_Project_Agreement_and_NDA.pdf read in full. The
  features page lists every B1 and B2 item and where it lives in the design or the store build
  (added the "Advanced CMS" row that was missing). B3 exclusions noted on that page.

Checked: mobile (375 px) home and products pages, no horizontal overflow, badges hidden, hamburger
nav, 12 products in a two-column grid with stacked buttons; desktop home with the full eight-item
nav, TM logo and rich hero. Local URL http://localhost:8080/landing-concepts/rudrika-site/index.html

Next: paste Tara's reel permalinks into REELS and the product `reel` fields, rebuild, then carry
the approved design into rudrika-web (Phase 2 rebrand).

## 2026-09-12, landing-page concepts and brighter creatives (Dan's request, out of plan order)

Dan asked for an immersive animated landing page and for brighter, lighter hero and banner
creatives, since the campaign photos read dark. He asked for both animation directions as two
separate pages to choose from, as standalone concepts to approve before anything touches the real
site, gave full authority to proceed, and said to follow the brand for the creatives.

Done:
- Confirmed the "hr images zip" (Archive 4.zip in Downloads) is the same 28 campaign photos already
  in the project, WhatsApp compressed to about 1280 px, not higher resolution. Flagged that a true
  high-resolution set from Tara would help large heroes.
- Built a creative pipeline (landing-concepts/src/make_creatives.py) that relights each photo,
  dissolves the dark studio backdrop into brand ivory and adds a warm-gold glow, so the images read
  light and premium. Output in assets/creatives/ (heroes, section bands, six fabric tiles, editorial,
  and two silk-texture crops for the 3D page).
- Built two standalone landing-page concepts (landing-concepts/, self-contained single files, brand
  kit colours, Cormorant Garamond and Jost and Great Vibes, the TM logo, real brand copy):
  - rudrika-landing-elegant.html: elegant on-brand motion. GSAP and ScrollTrigger, cinematic hero
    with ken-burns and cursor parallax, scroll reveals, 3D-tilt fabric tiles, a pinned horizontal
    new-arrivals gallery, marquee, parallax editorial quote.
  - rudrika-landing-immersive.html: full WebGL 3D. Three.js undulating silk mesh textured with a
    saree crop, gold particle field, scroll-driven camera, with the DOM content on translucent
    panels over the living backdrop.
- Hardened both: animation only runs when the page is actually visible, content and the loader never
  depend on the animation loop, reveals default visible, the pinned rail falls back to native scroll,
  and the 3D page falls back to a static airy hero if WebGL is unavailable or motion is reduced.

Checked: both pages served locally and reviewed section by section on desktop and a tall viewport.
Header contrast fixed over the light hero, the 3D silk hero renders and reads well, all copy present,
no em dashes, no icons. Note: animations are paused while a browser tab is hidden, so they are best
seen in a normal foreground tab.

Deliverables for Dan and Tara:
- landing-concepts/rudrika-landing-elegant.html
- landing-concepts/rudrika-landing-immersive.html

## 2026-09-12, Phase 1, project setup

Done:
- Located the Quppayam template on this Mac. Several snapshots exist under ~/Downloads/qpm. Dan asked
  for the latest, which is quppayam-store-v10 (the newest complete repo) plus the later deploy deltas
  quppayam-whatsapp-update, quppayam-v11, quppayam-v12 and quppayam-v15-story. Copied v10 to
  ./rudrika-web and layered the deltas in timestamp order (later files win), which reconstructs the
  latest local code and the final prisma schema. v12 subsumes the whatsapp-update changes, confirmed.
  Note: version numbers jump v12 to v15, so if v13 or v14 deploy zips exist they were not layered in.
- Local Postgres is Homebrew postgresql@15, already running. Created database rudrika_dev. Wrote
  rudrika-web/.env with DATABASE_URL, a fresh SESSION_SECRET, empty Razorpay keys (mock checkout) and
  NEXT_PUBLIC_STORE_NAME. No .env values printed in chat.
- npm install (npm policy blocks native install scripts, so ran npx prisma generate by hand),
  npx prisma db push, npm run seed (24 demo products, seeded admin printed to the terminal only),
  npm run dev on http://localhost:3000.
- Read the template and wrote docs/TEMPLATE-MAP.md (routes, models, key libs, and the gaps vs the
  plan). Key gap: this template version has only a CUSTOMER or ADMIN role with a single requireAdmin,
  not the guardPage/requireCan MANAGER/STAFF/STORE_MANAGER system the plan assumes, so staff roles
  are net-new in Phase 4.
- Placed a mock order end to end: order #1001, PLACED and PAID via MOCK, stock decremented.

Checked: template runs on the seed data and a mock order can be placed. Phase 1 done criterion met.

Local URL: http://localhost:3000 (storefront), http://localhost:3000/admin (admin).
Open decisions for later: whether v13 or v14 deltas exist and matter; the rest of the Phase 5
decisions when we reach go-live.

## 2026-09-12, Phase 0, refresh the prototype for Tara's approval

Done:
- Unpacked the handoff into the project root (68 entries confirmed with find). Read CLAUDE.md, RUDRIKA-BUILD-PLAN.md, assets/ASSETS.md and the ecommerce-client-build skill.
- Reworked prototype/src/build_site.py so it reads the canonical data/DATA.json, embeds the campaign photos and the logo as data URIs, and writes the single self-contained file to prototype/rudrika-by-tara-website.html. data/DATA.json is read only, never rewritten, so it stays clean for the real build (verified byte identical before and after).
- Logo with the trademark mark in the header, footer, invoice, mobile menu, admin sidebar and admin login. Source is the current site's transparent light logo (white wordmark, the TM is already baked into the file), saved into the project at assets/brand/logo/rudrika-logo-current-site-light.png as the interim source until the Playbook Digital Logo files arrive. The build tints that artwork maroon for the white surfaces (header, invoice, admin) and keeps it white for the maroon footer. Swap to the official Playbook file later by replacing that one PNG.
- Replaced the hero video with a still hero. Desktop uses a landscape crop (photo 09, purple pallu, green backdrop); mobile swaps to a portrait (photo 26, orange Kanjivaram) through a picture element. Swapped the exclusive block (16), Teera block (17), styling page (13) and about page (25) to campaign photos. All embedded as optimised JPEGs, max 1600 px, quality 80, so the file stays self-contained. Product images still come from the scraped catalogue as remote URLs.
- Applied the brand kit colours to the CSS variables: ivory #fff7f0, deep maroon #471113 (hover #6a1a1e), ink midnight blue #0e0f1e, warm gold #8a6d43 (a shade on the dark side of the kit Warm Gold so white text on the gold WhatsApp button clears AA contrast), light gold #dcc4a6, sand #f6ebe0. Announcement bar and header band kept maroon per the approved prototype.

Checked:
- Built to prototype/rudrika-by-tara-website.html, 1.24 MB, served locally and clicked through home, shop, product, cart, checkout, invoice, blog, styling, about, faq, contact, privacy, track and the full admin (dashboard plus orders, products, labels, invoices, reviews, photos, loyalty, customers, settings). Zero console errors on any route. Verified the responsive hero swaps to the portrait image at phone width, the logo renders as a data URI on every surface, and the ivory and maroon colours resolve to the kit hex values.

Deliverable for Tara: prototype/rudrika-by-tara-website.html

Next: Phase 1, project setup. This needs two decisions from Dan first (below).

Open decisions for Dan (Phase 1):
- The local path of the Quppayam template repo on this Mac, so it can be copied to ./rudrika-web.
- Which local PostgreSQL is available (Postgres.app, Homebrew or Docker).
