"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/account", "Overview"],
  ["/account/orders", "My orders"],
  ["/account/wishlist", "Wishlist"],
  ["/account/loyalty", "Loyalty points"],
  ["/account/circle", "Rudrika Circle"],
  ["/account/photos", "My photos and coupons"],
  ["/account/addresses", "Addresses"],
  ["/account/profile", "Profile and password"],
] as const;

export default function AccountNav() {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col gap-1 flex-wrap md:border-r md:border-gold/20 md:pr-4">
      {LINKS.map(([href, label]) => {
        const active = href === "/account" ? path === "/account" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-sm transition-colors ${
              active ? "bg-clay text-cream" : "hover:bg-sand text-ink/75"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
