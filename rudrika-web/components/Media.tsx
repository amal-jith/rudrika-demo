"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Image frame with a fixed shape.
 * The whole photo is shown, never cropped, never stretched, on a clean
 * background. If the file is missing, a tasteful placeholder is shown instead
 * of the browser's raw alt text.
 *
 * Upload creatives at 3:4 (e.g. 1200 x 1600 px) for an edge-to-edge fit.
 */
export default function Media({
  src,
  alt,
  ratio = "aspect-[3/4]",
  className = "",
  priority = false,
  // Every product grid on the site is 2 columns until `lg` (1024px), then 4.
  // The old default switched at 640px, so tablets and small laptops were shown
  // a quarter-width file stretched across half the screen, the same mistake
  // that made the gallery look soft.
  sizes = "(max-width: 1023px) 50vw, 25vw",
  fit = "contain",
}: {
  src?: string;
  alt: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fit?: "contain" | "cover";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed)
    return (
      <div
        className={`relative overflow-hidden bg-[#f3ecdd] ${ratio} ${className} flex items-center justify-center`}
      >
        <span className="font-display italic text-3xl sm:text-5xl text-gold/35 select-none">Q</span>
      </div>
    );

  return (
    <div className={`relative overflow-hidden bg-[#f7f2e9] ${ratio} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}
