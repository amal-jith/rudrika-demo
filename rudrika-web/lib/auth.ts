import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";
import { can, isStaff, type Area } from "./permissions";

const COOKIE = "rud_session";
const secret = () => process.env.SESSION_SECRET || "dev-secret";

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 30 * 24 * 3600 * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(sig))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data.uid as string;
  } catch {
    return null;
  }
}

export function setSessionCookie(userId: string) {
  cookies().set(COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 3600,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getUser() {
  const uid = verifyToken(cookies().get(COOKIE)?.value);
  if (!uid) return null;
  return db.user.findUnique({
    where: { id: uid },
    select: { id: true, email: true, name: true, phone: true, role: true, active: true },
  });
}

/**
 * The gate for everything in Admin.
 *
 * Two things have to be true: the account is switched on, and the role covers
 * the area being asked for. Turning someone off is deliberately separate from
 * their role, a deactivated manager keeps their history and can be switched
 * back on, rather than being deleted and rebuilt.
 *
 * This throws rather than redirects because it guards server actions as well
 * as pages. The server action is the real boundary: hiding a link in the
 * sidebar is presentation, refusing the write is security.
 */
export async function requireCan(area: Area) {
  const user = await getUser();
  if (!user || user.active === false || !can(user.role, area)) throw new Error("Unauthorized");
  return user;
}

/** Full-owner access. Kept under its old name so existing callers still read well. */
export async function requireAdmin() {
  return requireCan("staff");
}

/** Anyone allowed through the Admin front door, whatever their role. */
export async function requireStaff() {
  const user = await getUser();
  if (!user || user.active === false || !isStaff(user.role)) throw new Error("Unauthorized");
  return user;
}
