/**
 * One-time cleanup of videos uploaded straight from a phone.
 *
 * Nothing in the upload path touches video — sharp only handles images — so
 * every clip is sitting on disk at whatever bitrate the camera produced.
 * Several are 20-90 MB. A customer who taps play on a product video pays for
 * all of it, and on a phone connection that is the slowest thing on the site
 * by a wide margin.
 *
 * What this does NOT do, deliberately:
 *   • change any filename or extension — every URL in the database keeps working
 *   • touch images
 *   • re-encode a clip that is already small or already efficiently encoded
 *   • replace a file when the new version isn't actually smaller
 *
 * It also adds `+faststart`, which moves the index to the front of the file so
 * playback can begin before the download finishes. Most phone recordings put
 * the index at the end, which is why a big clip sits on a black frame for
 * several seconds before it starts.
 *
 * Requires ffmpeg:  apt install -y ffmpeg
 *
 * Run it in two steps:
 *   node scripts/compress-videos.js            # report only, changes nothing
 *   node scripts/compress-videos.js --apply    # do it
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "public", "uploads");
const APPLY = process.argv.includes("--apply");

/** Quality. Lower is better and bigger; 23 is visually transparent for most
 *  phone footage, 28 starts to show on flat fabric. 24 keeps texture in
 *  saree weave without leaving the file huge. */
const CRF = 24;

/** Below this we leave it alone — the re-encode isn't worth the risk. */
const SIZE_FLOOR = 3 * 1024 * 1024;

/** Long edge caps. Portrait phone video is capped at 1080 wide, landscape at
 *  1920 wide. Nothing on the site displays video larger than half a laptop
 *  screen, so anything beyond this is thrown away by the browser anyway. */
const MAX_PORTRAIT_W = 1080;
const MAX_LANDSCAPE_W = 1920;

const fmt = (n) => (n / 1024 / 1024).toFixed(1) + " MB";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function have(bin) {
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Ask ffprobe for the display dimensions, honouring any rotation flag. */
function probe(file) {
  const raw = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:stream_side_data=rotation",
      "-of", "json",
      file,
    ],
    { encoding: "utf8" }
  );
  const s = JSON.parse(raw).streams?.[0];
  if (!s?.width || !s?.height) throw new Error("no video stream");

  // A clip shot in portrait is often stored landscape with a -90 rotation
  // flag. ffmpeg applies that on decode, so the dimensions we plan against
  // are the swapped ones.
  const rot = Math.abs(Number(s.side_data_list?.[0]?.rotation ?? 0)) % 180;
  return rot === 90
    ? { width: s.height, height: s.width }
    : { width: s.width, height: s.height };
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error("No uploads folder at", ROOT);
    process.exit(1);
  }
  if (!have("ffmpeg") || !have("ffprobe")) {
    console.error("ffmpeg not found. Install it first:\n  apt install -y ffmpeg");
    process.exit(1);
  }

  const files = walk(ROOT).filter((f) => /\.(mp4|webm|mov)$/i.test(f));
  console.log(`${files.length} video file(s) found under public/uploads`);
  if (!APPLY) console.log("DRY RUN — nothing will be written. Add --apply to do it.\n");

  let before = 0;
  let after = 0;
  let changed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const stat = fs.statSync(file);
    const rel = path.relative(ROOT, file);

    if (stat.size < SIZE_FLOOR) {
      skipped += 1;
      continue;
    }

    let dim;
    try {
      dim = probe(file);
    } catch (e) {
      console.log(`  ! unreadable, left alone: ${rel} — ${e.message}`);
      failed += 1;
      continue;
    }

    const cap = dim.width >= dim.height ? MAX_LANDSCAPE_W : MAX_PORTRAIT_W;
    const targetW = Math.min(dim.width, cap);
    // -2 keeps the aspect ratio and rounds to an even number, which H.264
    // requires. Scaling by width alone would break on odd heights.
    const vf = `scale=${targetW}:-2`;

    const tmp = file + ".tmp-compress.mp4";

    try {
      execFileSync(
        "ffmpeg",
        [
          "-nostdin",
          "-v", "error",
          "-y",
          "-i", file,
          "-vf", vf,
          "-c:v", "libx264",
          "-crf", String(CRF),
          "-preset", "medium",
          "-pix_fmt", "yuv420p",   // required for Safari and older Android
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          tmp,
        ],
        { stdio: ["ignore", "ignore", "pipe"] }
      );

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
        `  ${rel}  ${fmt(stat.size)} → ${fmt(newSize)}` +
          `  (−${Math.round((1 - newSize / stat.size) * 100)}%)  ${dim.width}×${dim.height} → ${targetW}px`
      );

      if (APPLY) {
        // Match the permissions Apache needs before the file goes live.
        fs.chmodSync(tmp, 0o644);
        // Rename into place under the ORIGINAL name, extension included, so
        // every URL already stored in the database keeps resolving. A .webm
        // or .mov that gets H.264 inside it is still served fine — the
        // browser sniffs the container, and Apache's mime type for these is
        // only a hint.
        fs.renameSync(tmp, file);
      } else {
        fs.unlinkSync(tmp);
      }
    } catch (e) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      const detail = (e.stderr?.toString() || e.message).trim().split("\n").slice(-1)[0];
      console.log(`  ! failed, left alone: ${rel} — ${detail}`);
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

main();
