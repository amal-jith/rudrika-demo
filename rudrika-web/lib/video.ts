import { execFile } from "child_process";
import { promisify } from "util";
import { stat, chmod, rename, unlink } from "fs/promises";

const run = promisify(execFile);

/**
 * Automatic video compression for admin uploads.
 *
 * Photos have been shrunk on the way in since v14; video never was, so clips
 * straight off a phone were landing on disk at 30-90 MB and being served to
 * customers at that size.
 *
 * Encoding a large video takes anywhere from thirty seconds to a few minutes,
 * which is far too long to hold an HTTP request open. So the upload saves the
 * original and returns immediately, and this runs afterwards, replacing the
 * file in place once it's done. The filename never changes, so the URL that
 * was already handed back keeps working the whole time - worst case a
 * customer in that first minute gets the large version, which is exactly what
 * they would have got before anyway.
 */

/** Quality. Lower is better and bigger. 24 keeps the weave in a saree
 *  readable without leaving the file enormous. */
const CRF = 24;

/** Below this, compressing isn't worth the CPU. */
const SIZE_FLOOR = 3 * 1024 * 1024;

const MAX_PORTRAIT_W = 1080;
const MAX_LANDSCAPE_W = 1920;

let ffmpegOk: boolean | null = null;

async function haveFfmpeg(): Promise<boolean> {
  if (ffmpegOk !== null) return ffmpegOk;
  try {
    await run("ffmpeg", ["-version"]);
    await run("ffprobe", ["-version"]);
    ffmpegOk = true;
  } catch {
    console.warn("[video] ffmpeg not installed - videos will be stored uncompressed. Fix with: apt install -y ffmpeg");
    ffmpegOk = false;
  }
  return ffmpegOk;
}

/** Display dimensions, honouring the rotation flag phones set on portrait clips. */
async function probe(file: string) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:stream_side_data=rotation",
    "-of", "json",
    file,
  ]);
  const s = JSON.parse(stdout).streams?.[0];
  if (!s?.width || !s?.height) throw new Error("no video stream");
  const rot = Math.abs(Number(s.side_data_list?.[0]?.rotation ?? 0)) % 180;
  return rot === 90 ? { width: s.height, height: s.width } : { width: s.width, height: s.height };
}

/**
 * One at a time.
 *
 * The box has two cores and is also serving the shop. Letting an admin who
 * selects six clips at once spawn six encoders would make the site crawl for
 * everyone. Each job waits for the last to finish.
 */
let queue: Promise<void> = Promise.resolve();

export function queueCompress(filePath: string) {
  queue = queue.then(() => compress(filePath)).catch((e) => {
    console.error("[video] compression failed:", (e as Error).message);
  });
}

async function compress(file: string): Promise<void> {
  if (!(await haveFfmpeg())) return;

  const original = await stat(file);
  if (original.size < SIZE_FLOOR) return;

  const dim = await probe(file);
  const cap = dim.width >= dim.height ? MAX_LANDSCAPE_W : MAX_PORTRAIT_W;
  const targetW = Math.min(dim.width, cap);

  // Keep the same container the file was saved with, so the extension in the
  // URL still describes the contents.
  const isWebm = /\.webm$/i.test(file);
  const tmp = `${file}.tmp-compress.${isWebm ? "webm" : "mp4"}`;

  const codec = isWebm
    ? ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(CRF + 6), "-c:a", "libopus", "-b:a", "128k"]
    : ["-c:v", "libx264", "-crf", String(CRF), "-preset", "medium", "-c:a", "aac", "-b:a", "128k"];

  try {
    await run("ffmpeg", [
      "-nostdin",
      "-v", "error",
      "-y",
      "-i", file,
      // -2 keeps the aspect ratio and rounds to an even number, which the
      // codecs require. Scaling by width alone breaks on odd heights.
      "-vf", `scale=${targetW}:-2`,
      ...codec,
      "-pix_fmt", "yuv420p", // Safari and older Android refuse anything else
      // Puts the index at the front so playback can start before the download
      // finishes. Phone recordings put it at the end, which is why a big clip
      // sits on a black frame for several seconds.
      "-movflags", "+faststart",
      tmp,
    ], { maxBuffer: 8 * 1024 * 1024 });

    const shrunk = await stat(tmp);
    if (shrunk.size >= original.size) {
      // Already efficiently encoded - keep what we have.
      await unlink(tmp);
      return;
    }

    await chmod(tmp, 0o644);
    // Atomic, so a customer mid-download never sees a half-written file.
    await rename(tmp, file);

    const pct = Math.round((1 - shrunk.size / original.size) * 100);
    console.log(
      `[video] ${file.split("/").pop()}  ` +
        `${(original.size / 1048576).toFixed(1)}MB → ${(shrunk.size / 1048576).toFixed(1)}MB (−${pct}%)`
    );
  } catch (e) {
    await unlink(tmp).catch(() => {});
    // A failed encode must never cost the admin their upload - the original
    // is already saved and serving.
    throw e;
  }
}
