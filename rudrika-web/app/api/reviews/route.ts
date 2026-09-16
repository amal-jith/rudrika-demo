import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { productId, rating, title, body } = await req.json();
  const r = Math.round(Number(rating));
  if (!productId || !body || r < 1 || r > 5)
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });

  try {
    await db.review.create({
      data: { productId, userId: user.id, rating: r, title: title || null, body },
    });
  } catch {
    return NextResponse.json({ error: "You already reviewed this product" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
