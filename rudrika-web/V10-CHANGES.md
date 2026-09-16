# v10 — QA fixes, WhatsApp notifications, order downloads

## New features

### WhatsApp order notifications
When an order is confirmed, the boutique receives the full order (customer, phone, every item with size
and quantity, total, delivery address) and the customer receives a confirmation. Marking an order
**SHIPPED** in the admin panel messages the customer again.

Built on the official Meta WhatsApp Cloud API. Credentials go in `.env` — see **WHATSAPP-SETUP.md** for
the step-by-step, including the exact template wording to submit to Meta. Until credentials are added the
messages are written to the server log instead, and a messaging failure can never block an order.

### Order downloads
Admin → Orders now has:

- **Invoice / packing slip** on every order — a print-optimised sheet with order ID, customer, full
  address, every item with size, the size chart for the ordered size, fabric notes, and the totals
  breakdown. The browser's *Save as PDF* turns it into a PDF file; it also prints cleanly on A4.
  Built as a print sheet rather than a generated PDF so the rupee sign and the boutique's fonts render
  exactly right.
- **CSV export** — one row per line item, opens directly in Excel, Numbers or Google Sheets. Exports all
  orders, one status, the last 30 days, or a single order.
- **Message customer** — opens WhatsApp with the order reference pre-filled.

## QA report fixes

| # | Issue | Fix |
| --- | --- | --- |
| 1 | Search was case-sensitive — "Sarika" worked, "sarika" didn't | Matching now happens case-insensitively and also ignores accents and punctuation. Multi-word searches narrow properly ("silk saree"), and category names are searched too. Behaves identically on SQLite and PostgreSQL. |
| 2 | Wrong icon on the hero WhatsApp button | Real WhatsApp glyph, drawn inline as SVG (no extra network request) |
| 3 | Footer socials were plain text links | Circular icon buttons — Instagram, Facebook, WhatsApp, email |
| 4 | About page images were cut off | Story photos now sit in a portrait frame showing the whole garment; the two header photos are anchored to the top so faces are never cropped |
| 5 | Contact page WhatsApp buttons used the wrong icon | Real WhatsApp glyph on the branch buttons and "Chat on WhatsApp" |
| 6 | "Hours & socials" used text links | Icon buttons, with the email address kept below as text |
| 7 | "Buy Now" moved around on mobile | The inline button is hidden on phones — the sticky bottom bar already carries that action, and showing both is what made it appear to jump. Added bottom padding so the sticky bar never covers the fabric/shipping sections. |
| 8 | Buy Now after Add to Cart duplicated the item | Buy Now now *replaces* the line for that size instead of adding to it, so the total is correct in either order. |
| — | Observation: all products showing under New Arrivals | Each product row shows a set number of newest pieces (default 8, editable per section in Admin → Homepage, hard cap 24). Everything else is one tap away via "View all". |

## Also in this release

- The last remaining hardcoded `quppayam.com/public/uploads/...` links (homepage section defaults and the
  About page) are now relative paths, so nothing can break again if the domain changes.
- Razorpay payment verification is now idempotent — if Razorpay calls back twice for the same payment,
  the boutique gets one notification, not two.

## Deploying

```bash
cd /var/www/quppayam-next/quppayam
npm install
npm run build
pm2 restart quppayam-next --update-env
```

Nothing to migrate — the database schema is unchanged.

## Still to do

- **Razorpay keys** — send them over and they go into `.env` as `RAZORPAY_KEY_ID` and
  `RAZORPAY_KEY_SECRET`. Until then checkout runs in mock mode (orders are created, no money moves).
- **Speed** — image optimisation, `sharp` and the one-year cache headers are in this build but were never
  deployed. This release picks them up.
- Optional: Cloudflare in front of the domain for CDN delivery to Kerala mobile users.
