# v23 — Staff logins, stock, reports, bulk orders

## What changed

**Staff logins.** Three levels, set per person under Admin → Staff:

| Level | Sees | Cannot |
|---|---|---|
| **Owner** | Everything | — |
| **Manager** | Orders, products, photos, pricing, content, reports, customers | Settings, Staff |
| **Dispatch** | Orders and Stock only — no revenue, no totals, no customer list | Everything else, including uploads |

Nobody has to share your password. Switching someone off keeps their history.
You can't change your own level or switch yourself off, and the last Owner
can't be demoted — between them there's always a way back in.

**Stock.** New page listing everything sold out or running low, split so the
sold-out ones (money being turned away right now) sit at the top. Shows colour
as well as size. The threshold is yours to set under Settings.

**Reports.** Revenue, average order, pieces sold, revenue by month, best
sellers, and which colours and sizes actually move. Filterable 7 days to all
time. Only paid, non-cancelled orders count.

**Bulk orders.** Tick boxes on the orders list, change the status of the lot in
one action. Marking a batch SHIPPED still messages each customer — the confirm
box tells you exactly how many WhatsApps that is before it sends them.

## Deploy

One new database column. It is **additive with a default**, so every existing
row gets `active = true` and no order, product or customer is touched. The
`IF NOT EXISTS` makes it safe to run twice.

```bash
cd /var/www/quppayam-next/quppayam

# 1. take a dump first, as always
pg_dump "$(grep -o 'postgresql://[^"]*' .env)" > /root/backups/pre-v23-$(date +%F).sql

# 2. unpack
unzip -o /root/quppayam-v23-admin.zip -d .

# 3. the one schema change
psql "$(grep -o 'postgresql://[^"]*' .env)" -c \
  'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;'

# 4. REQUIRED — the Prisma client only regenerates on install, not on build,
#    so without this the build fails on the new column
npx prisma generate

# 5. build and restart
npm run build && pm2 restart quppayam-next --update-env
```

Do **not** run `npm run setup`, `npm run seed`, `prisma db push` or
`prisma migrate reset`. Each of those rewrites or wipes live data.

## After it's up

Admin → Staff. Your own account is already Owner. Add people from there.
Admin → Settings has a new field at the bottom for the low-stock number.
