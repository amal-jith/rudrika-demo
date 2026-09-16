"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { HomeIcon, ShopIcon, HeartIcon, BagIcon, UserIcon } from "./Icons";

const items = [
  ["/", "Home", HomeIcon],
  ["/products", "Shop", ShopIcon],
  ["/wishlist", "Wishlist", HeartIcon],
  ["/cart", "Cart", BagIcon],
  ["/account", "Account", UserIcon],
] as const;

export default function MobileNav() {
  const path = usePathname();
  const { count } = useCart();
  if (path.startsWith("/admin")) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-ink/10 grid grid-cols-5 text-[11px]">
      {items.map(([href, label, Icon]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`relative flex flex-col items-center gap-0.5 py-2 ${active ? "text-clay font-medium" : "text-ink/60"}`}>
            <Icon className="w-5 h-5" />
            {label}
            {href === "/cart" && count > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-4 bg-clay text-cream text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
