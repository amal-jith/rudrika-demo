# v11 — colour variants, shipping zones, stock display

This one changes the database, so the order of the steps matters.

## What's in it

**Stock** — set any size's stock to 0 in Admin → Products and that option shows struck through
on the product page. When every option is gone the product card shows a **Sold out** overlay and
the product page explains it's sold out instead of offering a dead Buy button.

**Shipping zones** — a new **Shipping** section in the admin. Each zone has a name, a list of
states, a charge and its own free-above threshold. Zones are checked top to bottom; the first one
listing the customer's state wins, and the one marked *Fallback* covers everyone else. The
checkout total updates as the customer types their state.

**Colour variants** — product rows now have a Colour column alongside Size. Stock is tracked per
colour *and* size, so "Rust M" can sell out while "Green M" stays available. Each colour can have
its own photos; picking a colour on the product page swaps the gallery. Leave Colour blank and the
product behaves exactly as before.

---

## Deploy, in order

**1. Back up the database first.** Not optional on this one.

```bash
cd /var/www/quppayam-next/quppayam
pg_dump "$(grep -o 'postgresql://[^"]*' .env)" > /root/backups/pre-v11-$(date +%F).sql
ls -lh /root/backups/pre-v11-*.sql
```

**2. Note your current counts** so you can confirm nothing moved:

```bash
node -e 'const{PrismaClient}=require("@prisma/client");const d=new PrismaClient();(async()=>{console.log("orders:",await d.order.count());console.log("products:",await d.product.count());console.log("variants:",await d.variant.count());await d.$disconnect();})()'
```

**3. Unpack the code.**

```bash
unzip -o /root/quppayam-v11.zip -d /var/www/quppayam-next/quppayam
```

**4. Run the migration.** Additive only — two new columns and one new table. Nothing is dropped
or rewritten, and it's safe to run twice.

```bash
psql "$(grep -o 'postgresql://[^"]*' .env)" -f scripts/migrate-v11.sql
```

You should see `ALTER TABLE`, `CREATE TABLE`, `INSERT 0 1` twice, then `COMMIT`.

**5. Regenerate, build, restart.**

```bash
npx prisma generate
npm run build
pm2 restart quppayam-next --update-env
```

**6. Confirm the counts are unchanged** — re-run the command from step 2. Orders, products and
variants must all match.

---

## First things to do in the admin

**Shipping** — open Admin → Shipping. Two zones are pre-created that reproduce your current rule
exactly (₹99, free above ₹3,000), so customers see no change until you edit them. Adjust the
Kerala rate, add a South India zone, whatever suits. Keep one zone ticked as **Fallback**.

**A colour product** — edit any product, add a second row with the same size but a different
colour, then upload photos under "Photos for each colour". Open the product page and the colour
buttons appear.

---

## If something looks wrong

| Symptom | Cause |
| --- | --- |
| Admin → Shipping says the table doesn't exist | Migration hasn't run. Do step 4. |
| Build fails mentioning `colour` or `shippingZone` | `npx prisma generate` was skipped after the migration. |
| Everything shows "Sold out" | Stock really is 0 on every variant — check Admin → Products. |
| Shipping shows the old flat ₹99 everywhere | No zones exist yet, so the code falls back to the old rule. Add a zone. |

**Rolling back.** The code is a normal restore from `/var/www/quppayam-backup-<date>`. The
database changes are additive, so the old code ignores them — you don't need to undo the
migration to roll back the app.
