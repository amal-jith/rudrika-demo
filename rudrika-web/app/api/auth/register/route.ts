import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { getRudrikaSettings, num } from "@/lib/settings";
import { addPoints } from "@/lib/loyalty";
import { waWelcome } from "@/lib/whatsapp-events";

/**
 * Customer registration. Name, phone and email are captured here (and again
 * at checkout) so every customer lands in the customer list. Welcome points
 * and the welcome WhatsApp message fire once.
 */
export async function POST(req: Request) {
  const { name, email, password, phone, whatsappOptIn } = await req.json();
  if (!name || !email || !password || password.length < 6)
    return NextResponse.json({ error: "Name, email and a 6+ character password are required" }, { status: 400 });
  if (!phone || String(phone).replace(/\D/g, "").length < 10)
    return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: String(phone),
      whatsappOptIn: whatsappOptIn !== false,
      password: await bcrypt.hash(password, 10),
    },
  });
  const s = await getRudrikaSettings();
  const welcome = num(s.loyalty_welcome_points, 50);
  if (welcome > 0) await addPoints(user.id, welcome, "WELCOME", { note: "Welcome points" });
  if (user.whatsappOptIn) waWelcome(user);
  setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
