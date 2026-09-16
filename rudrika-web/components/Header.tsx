"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { STORE } from "@/lib/store-config";
import Logo from "./Logo";
import { HeartIcon, MenuIcon, ChevronIcon, SearchIcon } from "./Icons";

type Cat = { name: string; slug: string };

const NAV = [
  ["/products", "New arrivals"],
  ["/collections", "Collections"],
  ["/letters", "Letters from Tara"],
  ["/gallery", "Wearing Rudrika"],
  ["/about", "Our story"],
  ["/contact", "Contact"],
] as const;

export default function Header({
  user,
  logo,
  announcements,
  categories = [],
}: {
  user: { name: string; role: string } | null;
  logo: string;
  announcements: string[];
  categories?: Cat[];
}) {
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-gold/20">
      {/* rotating announcement bar */}
      <div className="bg-ink text-gold-light text-[11px] sm:text-xs tracking-[0.2em] announce">
        {announcements.map((a, i) => (
          <span key={i}>{a}</span>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-24 sm:h-28 gap-4">
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <MenuIcon />
        </button>

        <Link href="/" className="flex items-center shrink-0">
          <Logo src={logo} className="h-14 sm:h-20" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm tracking-wide">
          {/* Shop by Category mega-menu */}
          <div className="relative group py-3">
            <button className="flex items-center gap-1.5 hover:text-clay transition-colors">
              Shop by fabric <ChevronIcon className="w-3 h-3 mt-0.5" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-cream border border-gold/30 shadow-2xl shadow-ink/15 p-6 w-[520px] grid grid-cols-3 gap-x-6 gap-y-2.5">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/products?category=${c.slug}`}
                    className="text-sm text-ink/75 hover:text-clay hover:translate-x-0.5 transition-all"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link href="/products" className="text-sm font-medium text-clay col-span-3 border-t border-gold/20 pt-3 mt-1">
                  View all sarees
                </Link>
              </div>
            </div>
          </div>

          {NAV.map(([href, label]) => (
            <Link key={label} href={href} className="hover:text-clay transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-5">
          <form onSubmit={search} className="hidden md:block">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sarees"
              className="border border-ink/20 bg-white px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-gold"
            />
          </form>
          {user ? (
            <Link href={user.role !== "CUSTOMER" ? "/admin" : "/account"} className="text-sm hover:text-clay">
              {user.role !== "CUSTOMER" ? "Admin" : user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/login" className="text-sm hover:text-clay">Sign in</Link>
          )}
          <Link href="/wishlist" className="hidden sm:block hover:text-clay" aria-label="Wishlist"><HeartIcon className="w-5 h-5" /></Link>
          <Link href="/cart" className="relative text-sm hover:text-clay">
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-clay text-cream text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-gold/20 px-6 py-4 flex flex-col gap-3 text-sm bg-cream animate-fade-in">
          <form onSubmit={search}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sarees" className="input" />
          </form>
          <Link href="/products" onClick={() => setOpen(false)} className="py-1 font-medium">All sarees</Link>
          <div className="text-[11px] uppercase tracking-widest text-gold-dark pt-2">Shop by fabric</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.map((c) => (
              <Link key={c.slug} href={`/products?category=${c.slug}`} onClick={() => setOpen(false)} className="text-ink/75 py-0.5">
                {c.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-gold/20 pt-3 mt-1 flex flex-col gap-2">
            {NAV.map(([href, label]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/track" onClick={() => setOpen(false)}>Track your order</Link>
            <Link href="/account/circle" onClick={() => setOpen(false)}>Rudrika Circle</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
