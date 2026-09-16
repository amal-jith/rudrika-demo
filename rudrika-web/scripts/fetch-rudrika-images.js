/**
 * Download every catalogue image in data/DATA.json into
 * public/uploads/products/<handle>/<n>.webp (WebP q82, max 2000px).
 * Idempotent: existing files are skipped. Run before the Shopify store closes.
 *   node scripts/fetch-rudrika-images.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "DATA.json"), "utf8"));
const OUT = path.join(__dirname, "..", "public", "uploads", "products");
const CONC = 6;

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Rudrika importer)" } });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const jobs = [];
  for (const p of DATA.products) {
    p.images.forEach((url, i) => jobs.push({ handle: p.handle, url, i }));
  }
  let done = 0, skipped = 0, failed = 0;
  const run = async (j) => {
    const dir = path.join(OUT, j.handle);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${j.i + 1}.webp`);
    if (fs.existsSync(file)) { skipped++; return; }
    try {
      const buf = await fetchBuf(j.url);
      await sharp(buf).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(file);
      done++;
    } catch (e) { failed++; console.error("FAIL", j.handle, j.i + 1, e.message); }
  };
  let idx = 0;
  await Promise.all(Array.from({ length: CONC }, async () => { while (idx < jobs.length) { const j = jobs[idx++]; await run(j); } }));
  console.log(`images: ${jobs.length} total, ${done} downloaded, ${skipped} skipped, ${failed} failed`);
}
main();
