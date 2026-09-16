/**
 * Failed-attempt throttle for the login endpoint.
 *
 * Until now /api/auth/login would accept unlimited guesses. Two problems with
 * that, and the second is arguably worse than the first:
 *
 *   1. Someone can work through a password list against the admin account for
 *      as long as they like. The shop holds real orders, addresses and phone
 *      numbers.
 *   2. Every guess costs a bcrypt comparison, which is deliberately slow. A
 *      few hundred requests a second would pin both cores and take the shop
 *      down for actual customers, no password needed.
 *
 * The counter lives in memory. The site runs as a single pm2 process, so one
 * process sees every attempt and that is sufficient. It resets on restart,
 * which is fine: a restart is not something an attacker can trigger.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

/** Stop the map growing without bound on a long-running process. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  // forEach rather than for..of, the project targets an older ES level and
  // won't iterate a Map directly without downlevelIteration.
  const stale: string[] = [];
  buckets.forEach((b, k) => {
    if (b.resetAt < now) stale.push(k);
  });
  stale.forEach((k) => buckets.delete(k));
}

/**
 * Best-effort client address.
 *
 * Apache sits in front and sets X-Forwarded-For, appending on each hop, so
 * the original client is the first entry. Anything after that was added by
 * our own proxy and can't be trusted less than the first, but the first is
 * also the only one the client controls, which is why this is a throttle and
 * not an access control.
 */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** True when this key has failed too often and should be turned away. */
export function isBlocked(key: string): boolean {
  const b = buckets.get(key);
  if (!b) return false;
  if (b.resetAt < Date.now()) {
    buckets.delete(key);
    return false;
  }
  return b.count >= MAX_FAILURES;
}

/** Seconds until the caller may try again. */
export function retryAfter(key: string): number {
  const b = buckets.get(key);
  if (!b) return 0;
  return Math.max(1, Math.ceil((b.resetAt - Date.now()) / 1000));
}

export function recordFailure(key: string): void {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  b.count += 1;
  // Each failure past the limit pushes the unlock further out, so a script
  // that keeps hammering never gets back in.
  if (b.count >= MAX_FAILURES) b.resetAt = now + WINDOW_MS;
}

/** A correct password clears the slate for that client. */
export function recordSuccess(key: string): void {
  buckets.delete(key);
}
