"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { splitPair, type Slide } from "@/lib/section-types";
import { heroTemplate, TONES } from "@/lib/hero-templates";
import { WhatsAppIcon } from "@/components/Icons";

type D = Record<string, any>;

function target(h?: string, wa?: string) {
  if (h === "whatsapp")
    return `https://wa.me/${wa}?text=${encodeURIComponent("Hello Rudrika by Tara, I would like to know more.")}`;
  return h || "/products";
}

function Btn({ label, h, wa, cls }: { label?: string; h?: string; wa: string; cls: string }) {
  if (!label) return null;
  const url = target(h, wa);
  if (h === "whatsapp")
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cls} inline-flex items-center justify-center gap-2`}
      >
        <WhatsAppIcon className="w-[1.1em] h-[1.1em]" /> {label}
      </a>
    );
  return (
    <Link href={url} className={cls}>
      {label}
    </Link>
  );
}

export default function Hero({ d, whatsapp }: { d: D; whatsapp: string }) {
  const slides: Slide[] = Array.isArray(d.slides) && d.slides.length ? d.slides : [d as Slide];
  const [i, setI] = useState(0);
  const ms = Math.max(2, Number(d.interval) || 6) * 1000;

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), ms);
    return () => clearInterval(t);
  }, [slides.length, ms]);

  const s = slides[i] ?? {};
  const tpl = heroTemplate(d.template);
  const T = TONES[tpl.palette];

  /* ── building blocks ─────────────────────────── */

  const Stats = ({ center }: { center?: boolean }) => {
    if (!d.showStats) return null;
    const items = [d.stat1, d.stat2, d.stat3].map(splitPair).filter(([n]) => n);
    if (!items.length) return null;
    return (
      <div className={`mt-8 flex flex-wrap gap-x-8 sm:gap-x-10 gap-y-4 text-[11px] ${T.statLbl} ${center ? "justify-center" : ""}`}>
        {items.map(([n, l]) => (
          <div key={l}>
            <div className={`font-display text-xl sm:text-2xl leading-none mb-1 ${T.statNum}`}>{n}</div>
            {l}
          </div>
        ))}
      </div>
    );
  };

  const Chips = ({ center }: { center?: boolean }) =>
    !tpl.chips ? null : (
      <div className={`mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.18em] ${T.chip} ${center ? "justify-center" : ""}`}>
        <span>Handcrafted sarees</span>
        <span className="opacity-40">/</span>
        <span>Free shipping above Rs. 4,999</span>
        <span className="opacity-40">/</span>
        <span>Delivered across India</span>
      </div>
    );

  const Dots = ({ center }: { center?: boolean }) =>
    slides.length < 2 ? null : (
      <div className={`flex gap-2 mt-8 ${center ? "justify-center" : ""}`}>
        {slides.map((_, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-label={`Slide ${k + 1}`}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              k === i ? `w-10 ${T.dotOn}` : `w-4 ${T.dotOff}`
            }`}
          />
        ))}
      </div>
    );

  /** the words, always on a solid panel, never over a photo */
  const Copy = ({ center, size = "md" }: { center?: boolean; size?: "sm" | "md" | "lg" }) => (
    <div key={i} className={`animate-fade-up ${center ? "text-center flex flex-col items-center" : ""}`}>
      {s.eyebrow && (
        <div className={`flex items-center gap-3 mb-5 ${center ? "justify-center" : ""}`}>
          <span className={`h-px w-8 ${T.rule}`} />
          <span className={`text-[10px] sm:text-[11px] uppercase tracking-[0.32em] ${T.eyebrow}`}>
            {s.eyebrow}
          </span>
          {center && <span className={`h-px w-8 ${T.rule}`} />}
        </div>
      )}

      <h1
        className={`font-display leading-[1.1] ${
          size === "lg"
            ? "text-[2.15rem] sm:text-5xl lg:text-[3.9rem]"
            : size === "sm"
            ? "text-[1.85rem] sm:text-4xl"
            : "text-[2rem] sm:text-[2.9rem] lg:text-5xl"
        }`}
      >
        {s.title}
        {s.titleEm && (
          <>
            {" "}
            <em className={`${T.em} inline-block`}>{s.titleEm}</em>
          </>
        )}
      </h1>

      {s.subtitle && (
        <p className={`mt-5 text-sm sm:text-[15px] leading-relaxed max-w-[30rem] ${T.body}`}>
          {s.subtitle}
        </p>
      )}

      <div className={`mt-7 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
        <Btn label={s.ctaLabel} h={s.ctaHref} wa={whatsapp} cls={`${T.primaryBtn} !px-6`} />
        <Btn label={d.cta2Label} h={d.cta2Href} wa={whatsapp} cls={`${T.ghostBtn} !px-6`} />
      </div>

      <Chips center={center} />
      <Stats center={center} />
      <Dots center={center} />
    </div>
  );

  /** a photo frame that crops from the top so faces/outfits stay in view */
  const Portrait = ({
    src,
    ratio = "aspect-[3/4]",
    framed,
    priority,
    sizes = "(max-width: 768px) 100vw, 45vw",
  }: {
    src?: string;
    ratio?: string;
    framed?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => (
    <div className={`relative ${ratio} overflow-hidden bg-black/10`}>
      {src && (
        <Image src={src} alt={s.title || "Rudrika by Tara"} fill priority={priority} sizes={sizes}
          className="object-cover object-top" />
      )}
      {framed && <span className={`absolute inset-0 border ${T.frame} pointer-events-none`} />}
    </div>
  );

  /** cross-fading stack of all slide photos */
  const PortraitStack = ({
    ratio = "aspect-[3/4]",
    framed,
    sizes = "(max-width: 768px) 100vw, 45vw",
  }: {
    ratio?: string;
    framed?: boolean;
    sizes?: string;
  }) => (
    <div className={`relative ${ratio} overflow-hidden bg-black/10`}>
      {slides.map((sl, j) =>
        sl.image ? (
          <Image
            key={j}
            src={sl.image}
            alt={sl.title || "Rudrika by Tara"}
            fill
            priority={j === 0}
            sizes={sizes}
            className={`object-cover object-top transition-opacity duration-[900ms] ${
              j === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : null
      )}
      {framed && <span className={`absolute inset-0 border ${T.frame} pointer-events-none`} />}
    </div>
  );

  const other = (k: number) => slides[(i + k) % slides.length]?.image ?? d.image2;

  /* ── layouts ─────────────────────────────────── */

  // ATELIER, colour panel + one framed portrait beside it
  if (tpl.layout === "atelier")
    return (
      <section className={`${T.panel}`}>
        <div className={`max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-0`}>
          <div className={`px-5 sm:px-10 lg:px-14 py-12 sm:py-16 lg:py-24 ${tpl.flip ? "lg:order-2" : ""}`}>
            <Copy size="lg" />
          </div>
          <div className={`px-5 sm:px-10 lg:px-0 pb-12 lg:py-14 ${tpl.flip ? "lg:order-1 lg:pl-14" : "lg:pr-14"}`}>
            <div className="lg:max-w-[440px] lg:ml-auto">
              <PortraitStack ratio="aspect-[4/5] sm:aspect-[3/4]" framed />
            </div>
          </div>
        </div>
      </section>
    );

  // CURTAIN, photo panel with a solid colour column of text next to it
  if (tpl.layout === "curtain")
    return (
      <section className={T.page}>
        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
          <div className="relative">
            <PortraitStack ratio="aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[640px]" sizes="60vw" />
          </div>
          <div className={`${T.panel} px-5 sm:px-10 lg:px-14 py-12 sm:py-16 lg:py-20 flex flex-col justify-center`}>
            <Copy />
          </div>
        </div>
      </section>
    );

  // DUET, colour panel with two staggered portraits
  if (tpl.layout === "duet")
    return (
      <section className={T.panel}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center">
          <Copy />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="lg:pt-10">
              <PortraitStack ratio="aspect-[3/4]" framed sizes="(max-width:768px) 45vw, 26vw" />
            </div>
            <div className="lg:pb-10">
              <Portrait src={other(1)} ratio="aspect-[3/4]" framed sizes="(max-width:768px) 45vw, 26vw" />
            </div>
          </div>
        </div>
      </section>
    );

  // GALLERY, centred words on a colour band, three portraits underneath
  if (tpl.layout === "gallery")
    return (
      <section className={T.page}>
        <div className={`${T.panel}`}>
          <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-14">
            <Copy center size="lg" />
          </div>
        </div>
        <div className={`${T.panel} pb-0`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-3 gap-2 sm:gap-4 pb-10 sm:pb-14">
            {[0, 1, 2].map((k) => (
              <Portrait key={k} src={other(k)} ratio="aspect-[3/4]" framed sizes="31vw" priority={k === 0} />
            ))}
          </div>
        </div>
      </section>
    );

  // SPOTLIGHT, one portrait centre stage, words above and below
  if (tpl.layout === "spotlight")
    return (
      <section className={T.panel}>
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-12 sm:py-16 text-center">
          <div key={i} className="animate-fade-up">
            {s.eyebrow && (
              <div className="flex items-center gap-3 justify-center mb-4">
                <span className={`h-px w-8 ${T.rule}`} />
                <span className={`text-[10px] uppercase tracking-[0.32em] ${T.eyebrow}`}>{s.eyebrow}</span>
                <span className={`h-px w-8 ${T.rule}`} />
              </div>
            )}
            <h1 className="font-display text-[2rem] sm:text-5xl leading-[1.1]">
              {s.title} {s.titleEm && <em className={T.em}>{s.titleEm}</em>}
            </h1>
          </div>

          <div className="mt-8 sm:mt-10 max-w-md mx-auto">
            <PortraitStack ratio="aspect-[4/5]" framed sizes="(max-width:768px) 90vw, 420px" />
          </div>

          <div className="mt-8">
            {s.subtitle && <p className={`text-sm sm:text-[15px] max-w-lg mx-auto ${T.body}`}>{s.subtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Btn label={s.ctaLabel} h={s.ctaHref} wa={whatsapp} cls={`${T.primaryBtn} !px-6`} />
              <Btn label={d.cta2Label} h={d.cta2Href} wa={whatsapp} cls={`${T.ghostBtn} !px-6`} />
            </div>
            <Chips center />
            <Stats center />
            <div className="flex justify-center"><Dots /></div>
          </div>
        </div>
      </section>
    );

  // FRAME, wide framed photo with the caption panel overlapping beneath it
  return (
    <section className={T.page}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className={`p-2 sm:p-3 border ${T.frame}`}>
          <PortraitStack ratio="aspect-[4/5] sm:aspect-[16/9]" sizes="100vw" />
        </div>
        <div className={`${T.panel} mx-auto -mt-8 sm:-mt-12 relative z-10 max-w-3xl px-6 sm:px-10 py-8 sm:py-10 text-center`}>
          <Copy center size="sm" />
        </div>
      </div>
    </section>
  );
}
