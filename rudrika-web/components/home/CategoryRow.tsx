"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

type Cat = { id: string; name: string; slug: string; image: string | null };

export default function CategoryRow({ categories }: { categories: Cat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [categories.length]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };

  const Arrow = ({ dir, hidden }: { dir: 1 | -1; hidden: boolean }) => (
    <button
      onClick={() => scroll(dir)}
      aria-label={dir === 1 ? "Next categories" : "Previous categories"}
      className={`hidden sm:flex absolute top-[52px] ${dir === 1 ? "right-0" : "left-0"} z-10
        w-10 h-10 rounded-full bg-white border border-gold/40 text-clay shadow-md
        items-center justify-center hover:bg-clay hover:text-cream hover:border-clay
        transition-all ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {dir === 1 ? "›" : "‹"}
    </button>
  );

  return (
    <div className="relative px-0 sm:px-14">
      <Arrow dir={-1} hidden={atStart} />
      <Arrow dir={1} hidden={atEnd} />

      <div
        ref={ref}
        className="flex gap-6 sm:gap-8 overflow-x-auto scroll-smooth pb-4 px-6 sm:px-2 sm:justify-start"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className="group text-center shrink-0 w-[104px] sm:w-[124px]">
            <div className="relative w-[104px] h-[104px] sm:w-[124px] sm:h-[124px] rounded-full overflow-hidden bg-sand ring-2 ring-gold/40 ring-offset-4 ring-offset-cream group-hover:ring-gold transition-all flex items-center justify-center">
              {c.image && !broken[c.id] ? (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="124px"
                  onError={() => setBroken((b) => ({ ...b, [c.id]: true }))}
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="font-display italic text-2xl text-gold/40 select-none">Q</span>
              )}
            </div>
            <div className="mt-3 text-sm font-medium leading-snug group-hover:text-clay transition-colors">
              {c.name}
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
