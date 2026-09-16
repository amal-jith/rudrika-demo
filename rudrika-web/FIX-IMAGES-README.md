# Fixing the broken images on the live site

## What went wrong

Every product photo, category photo and the logo were stored as
`https://quppayam.com/public/uploads/all/…` — the **old Laravel site's** URLs.

When the new app took over `quppayam.com`, those paths stopped existing, so every
image 404s and the browser shows the alt text instead.

The hero and promo banners still work because those files are bundled inside the app.

## The fix

The image files are still on your droplet, inside the old site's folder. Copy them
into the new app and repoint the database at the local copies.

**On the server, from inside the app folder:**

```bash
bash scripts/fix-images.sh
```

That script:

1. Finds the old `*/public/uploads/all` directory
2. Copies every file into this app's `public/uploads/all/`
3. Runs `scripts/relink-images.ts`, which rewrites all image links in the database
   from the dead URLs to `/uploads/all/…`

Then rebuild and restart:

```bash
npm install          # picks up sharp (image optimisation)
npm run build
pm2 restart all      # or: systemctl restart quppayam
```

### If the script can't find the old folder

Locate it manually:

```bash
find / -type d -name "all" -path "*uploads*" 2>/dev/null
```

Copy that folder to `public/uploads/all`, then run:

```bash
npx tsx scripts/relink-images.ts
npm run build && pm2 restart all
```

### If the old files are truly gone

The site still works — missing images now show a tasteful gold "Q" placeholder
instead of broken alt text. Upload fresh photos through **Admin → Products**.

---

## Speed improvements included

Image optimisation was previously switched off, which meant every visitor
downloaded full-size originals (~400 KB each — a homepage could be 8 MB+).

Now:

- **Next.js image optimisation is on** — automatic resizing plus AVIF/WebP.
  Expect roughly 80–90 % smaller images.
- **`sharp` added** — the fast native optimiser. Without it Next.js falls back to a
  much slower path, so make sure `npm install` runs on the server.
- **Aggressive caching** — `/uploads/*` is served with a one-year immutable
  cache header, so repeat visits load instantly.
- **Responsive sizes** — phones download phone-sized images, not desktop ones.

### Recommended: put Cloudflare in front

Free plan, 10 minutes: point the domain's nameservers at Cloudflare and enable
proxying. Images and CSS then get served from a CDN edge near the customer —
a big win for Kerala visitors on mobile data. No code changes needed.

---

## Preventing this in future

- Seed data now uses **relative** paths (`/uploads/all/…`), so a fresh install
  never depends on an external host.
- `Media`, `Logo` and the category row all fall back gracefully if a file is
  missing — no more raw alt text.
- If you later move images to S3/R2/Cloudinary, set `NEXT_PUBLIC_IMAGE_BASE`
  in `.env` and re-run the seed. No code change required.
