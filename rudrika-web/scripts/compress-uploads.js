/**
 * One-time cleanup of photos uploaded before the compression step existed.
 *
 * Anything added since v14 already goes through sharp on the way in. Everything
 * from before is sitting at full camera resolution — 2 to 4 MB each — and every
 * first-time visitor pays for that while Next.js resizes it on demand.
 *
 * What this does NOT do, deliberately:
 *   • change any filename or extension — every URL in the database keeps working
 *   • touch WebP, SVG, GIF or video
 *   • replace a file when the new version isn't actually smaller
 *
 * It writes to a temporary file and renames it into place, so a file is never
 * half-written while Apache is serving it.
 *
 * Run it in two steps:
 *   node scripts/compress-uploads.js            # report only, changes nothing
 *   node scripts/compress-uploads.js --apply    # do it
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..", "public", "uploads");
const MAX_EDGE = 2000;
const APPLY = process.argv.includes("--apply");

/** Below this we leave it alone — the saving wouldn't be worth the re-encode. */
const SIZE_FLOOR = 400 * 1024;

const fmt = (n) => (n / 1024 / 1024).toFixed(1) + " MB";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    console.error("No uploads folder at", ROOT);
    process.exit(1);
  }

  const files = walk(ROOT).filter((f) => /\.(jpe?g|png)$/i.test(f));
  console.log(`${files.length} JPEG/PNG files found under public/uploads`);
  if (!APPLY) console.log("DRY RUN — nothing will be written. Add --apply to do it.\n");

  let before = 0;
  let after = 0;
  let changed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const stat = fs.statSync(file);
    let meta;
    try {
      meta = await sharp(file).metadata();
    } catch (e) {
      console.log(`  ! unreadable, left alone: ${path.relative(ROOT, file)}`);
      failed += 1;
      continue;
    }

    const oversized = Math.max(meta.width || 0, meta.height || 0) > MAX_EDGE;
    if (!oversized && stat.size < SIZE_FLOOR) {
      skipped += 1;
      continue;
    }

    const isPng = /\.png$/i.test(file);
    const tmp = file + ".tmp-compress";

    try {
      let pipeline = sharp(file)
        .rotate() // honour EXIF so nothing ends up on its side
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });

      // Same format out as in, so the URL never changes.
      pipeline = isPng
        ? pipeline.png({ compressionLevel: 9, palette: true })
        : pipeline.jpeg({ quality: 82, mozjpeg: true });

      await pipeline.toFile(tmp);

      const newSize = fs.statSync(tmp).size;
      if (newSize >= stat.size) {
        fs.unlinkSync(tmp);
        skipped += 1;
        continue;
      }

      before += stat.size;
      after += newSize;
      changed += 1;

      console.log(
        `  ${path.relative(ROOT, file)}  ${fmt(stat.size)} → ${fmt(newSize)}` +
          `  (−${Math.round((1 - newSize / stat.size) * 100)}%)`
      );

      if (APPLY) {
        // Match the permissions Apache needs before the file goes live.
        fs.chmodSync(tmp, 0o644);
        fs.renameSync(tmp, file);
      } else {
        fs.unlinkSync(tmp);
      }
    } catch (e) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.log(`  ! failed, left alone: ${path.relative(ROOT, file)} — ${e.message}`);
      failed += 1;
    }
  }

  console.log(
    `\n${changed} file(s) ${APPLY ? "rewritten" : "would shrink"}, ` +
      `${skipped} already fine, ${failed} skipped on error`
  );
  if (changed) {
    console.log(`${fmt(before)} → ${fmt(after)}  (saves ${fmt(before - after)})`);
  }
  if (!APPLY && changed) console.log("\nRe-run with --apply to write the changes.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
