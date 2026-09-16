"use client";

import { useState } from "react";

/**
 * Brand logo. Rudrika is a registered trademark: the logo file carries the TM
 * mark. If the image is missing, a typeset wordmark with the TM is shown so the
 * header and footer never show broken alt text.
 */
export default function Logo({
  src,
  className = "h-16 sm:h-24",
  white = false,
}: {
  src?: string;
  className?: string;
  white?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed)
    return (
      <span className={`flex flex-col justify-center leading-none ${white ? "text-cream" : "text-clay"}`}>
        <span className="font-display text-2xl sm:text-3xl tracking-[0.12em]">
          RUDRIKA<sup className="text-[9px] ml-0.5 align-super">TM</sup>
        </span>
        <span className={`text-[9px] sm:text-[10px] tracking-[0.4em] uppercase mt-1 ${white ? "text-gold-light" : "text-gold-dark"}`}>
          by Tara
        </span>
      </span>
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={white && src.includes("rudrika-logo-maroon") ? src.replace("rudrika-logo-maroon", "rudrika-logo-white") : src}
      alt="Rudrika by Tara"
      onError={() => setFailed(true)}
      className={`${className} w-auto object-contain`}
      style={white && !src.includes("rudrika-logo") ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
