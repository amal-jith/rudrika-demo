"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Item = { type: "image" | "video"; src: string };

export default function ProductGallery({
  images,
  videos,
  name,
}: {
  images: string[];
  videos: string[];
  name: string;
}) {
  const items: Item[] = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...videos.map((src) => ({ type: "video" as const, src })),
  ];
  const [active, setActive] = useState(0);

  // Back to the first photo whenever the set of photos changes, which in
  // practice means the customer picked a different colour.
  //
  // This used to be done by giving the whole component a `key` in BuyBox, but
  // a changing key tells React to throw the gallery away and build a new one,
  // so every <Image> was destroyed and recreated and the photos visibly
  // reloaded. Resetting one number does the same job and leaves the DOM alone.
  const signature = items.map((i) => i.src).join("|");
  useEffect(() => {
    setActive(0);
  }, [signature]);

  if (!items.length) return <div className="aspect-[3/4] bg-sand" />;

  const cur = items[Math.min(active, items.length - 1)];

  return (
    <div className="space-y-3">
      {/* main view */}
      <div className="relative aspect-[3/4] bg-[#f7f2e9] overflow-hidden">
        {cur.type === "image" ? (
          <Image
            src={cur.src}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        ) : (
          // `preload="metadata"` is the important part: the browser fetches the
          // header to work out the duration and draw the scrubber, and nothing
          // more, until the customer actually presses play.
          <video
            src={cur.src}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-ink"
          />
        )}

        {items.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + items.length) % items.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gold/40 text-clay flex items-center justify-center hover:bg-clay hover:text-cream transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % items.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gold/40 text-clay flex items-center justify-center hover:bg-clay hover:text-cream transition-colors"
            >
              ›
            </button>
            <div className="absolute bottom-3 right-3 bg-ink/70 text-cream text-[11px] px-2 py-1">
              {active + 1} / {items.length}
            </div>
          </>
        )}
      </div>

      {/* thumbnails */}
      {items.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-[3/4] overflow-hidden bg-[#f7f2e9] border-2 transition-colors ${
                i === active ? "border-clay" : "border-transparent hover:border-gold/50"
              }`}
            >
              {it.type === "image" ? (
                <Image src={it.src} alt="" fill sizes="90px" className="object-contain" />
              ) : (
                // This used to be a real <video> element, purely to draw a
                // 90px thumbnail. Every one of them made the browser reach
                // for the file, on a product with a 40 MB clip that is an
                // enormous price to pay for a postage stamp the customer may
                // never click. A plain tile costs nothing and reads the same.
                <span className="absolute inset-0 flex items-center justify-center bg-ink text-cream text-lg">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
