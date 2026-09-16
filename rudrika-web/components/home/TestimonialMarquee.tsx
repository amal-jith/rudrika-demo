"use client";

import Image from "next/image";
import { StarIcon } from "@/components/Icons";

type T = { id: string; name: string; text: string; rating: number; image: string | null };

export default function TestimonialMarquee({
  items,
  speed = 60,
}: {
  items: T[];
  speed?: number;
}) {
  if (!items.length) return null;
  // duplicate the list so the loop is seamless
  const row = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden group"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div
        className="flex gap-5 w-max marquee-track"
        style={{ animationDuration: `${speed}s` }}
      >
        {row.map((t, i) => (
          <figure
            key={`${t.id}-${i}`}
            className="bg-white border border-gold/15 p-6 w-[280px] sm:w-[330px] shrink-0"
          >
            <div className="text-gold text-sm mb-3">{[1, 2, 3, 4, 5].map((k) => <StarIcon key={k} className="w-3.5 h-3.5 inline" filled={k <= t.rating} />)}</div>
            <blockquote className="text-sm text-ink/70 leading-relaxed line-clamp-4">“{t.text}”</blockquote>
            <figcaption className="mt-4 text-xs uppercase tracking-widest text-ink/50 flex items-center gap-2">
              {t.image && (
                // A plain <img> here downloaded the customer's full-size photo
                // to fill a 28px circle, and the track is duplicated for the
                // seamless loop, so every one of them was fetched twice. Going
                // through next/image with an explicit size means the browser
                // gets a thumbnail instead of the original.
                <span className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                  <Image src={t.image} alt="" fill sizes="28px" className="object-cover" />
                </span>
              )}
             , {t.name}
            </figcaption>
          </figure>
        ))}
      </div>

      <style jsx>{`
        .marquee-track {
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
