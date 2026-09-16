"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "./Icons";

export default function WishlistButton({
  productId,
  initial,
  loggedIn,
}: {
  productId: string;
  initial: boolean;
  loggedIn: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (!loggedIn) return router.push("/login");
    setBusy(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const data = await res.json();
      setOn(data.wishlisted);
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy} className="text-sm text-ink/60 hover:text-clay transition-colors inline-flex items-center gap-1.5">
      <HeartIcon className="w-4 h-4" filled={on} /> {on ? "Saved to wishlist" : "Add to wishlist"}
    </button>
  );
}
