import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { productId } = await req.json();
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.wishlist.findUnique({ where: key });

  if (existing) {
    await db.wishlist.delete({ where: key });
    return NextResponse.json({ wishlisted: false });
  }
  await db.wishlist.create({ data: { userId: user.id, productId } });
  return NextResponse.json({ wishlisted: true });
}
