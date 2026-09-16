import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { clientKey, isBlocked, retryAfter, recordFailure, recordSuccess } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const key = clientKey(req);

  // Checked before the password is compared, so a flood of guesses can't keep
  // both cores busy running bcrypt while real customers wait.
  if (isBlocked(key)) {
    const wait = retryAfter(key);
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(wait) } }
    );
  }

  const { email, password } = await req.json();
  const user = await db.user.findUnique({ where: { email: (email ?? "").toLowerCase() } });

  if (!user || !(await bcrypt.compare(password ?? "", user.password))) {
    recordFailure(key);
    // Deliberately the same message whether the address exists or not, a
    // different one would let someone confirm which emails have accounts.
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  recordSuccess(key);
  setSessionCookie(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
