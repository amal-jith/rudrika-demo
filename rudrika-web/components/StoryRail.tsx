"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type Story = {
  id: string;
  title: string;
  subtitle: string | null;
  /** A paragraph or two about the event, shown above the photos on /gallery. */
  story?: string | null;
  cover: string;
  photos: string[];
};

const HOLD_MS = 4000;

/**
 * Instagram-style stories.
 *
 * A rail of circular covers; tapping one opens a full-screen viewer that
 * advances on a timer, on tap, and with the arrow keys. Photos are only
 * mounted once their story is opened, so a homepage with a dozen events
 * still costs one thumbnail each on first paint.
 */
/** How long each cover photo rests before the circle cycles to the next. */
const COVER_CYCLE_MS = 3200;

export default function StoryRail({ stories }: { stories: Story[] }) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpenAt(i)}
            className="shrink-0 w-[76px] sm:w-24 text-center group"
          >
            {/* The photo inside cycles through the story, so the rail is alive
                without anything actually moving on the page. */}
            <span className="block p-[2.5px] rounded-full bg-gradient-to-tr from-gold via-clay to-gold-dark transition-transform duration-500 group-hover:scale-105">
              <span className="block p-[2.5px] bg-cream rounded-full">
                <span className="block relative aspect-square rounded-full overflow-hidden">
                  <CyclingCover story={s} delay={i * 700} />
                </span>
              </span>
            </span>
            <span className="block mt-2 text-[11px] leading-tight text-ink/70 line-clamp-2">
              {s.title}
            </span>
          </button>
        ))}
      </div>

      {openAt !== null && (
        <StoryViewer
          stories={stories}
          startAt={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  );
}

/**
 * The photo inside a story circle, cross-fading between that story's pictures.
 * Each circle starts on a stagger so they don't all flip in unison.
 */
function CyclingCover({ story, delay }: { story: Story; delay: number }) {
  const shots = story.photos.length > 1 ? story.photos : [story.cover];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (shots.length < 2) return;
    // Respect the visitor's motion preference, no cycling if they've asked
    // the operating system for reduced motion.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => setI((n) => (n + 1) % shots.length), COVER_CYCLE_MS);
    }, delay);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [shots.length, delay]);

  return (
    <>
      {shots.map((src, n) => (
        <Image
          key={src}
          src={src}
          alt={n === 0 ? story.title : ""}
          fill
          sizes="96px"
          className="object-cover transition-opacity duration-700"
          style={{ opacity: n === i ? 1 : 0 }}
          priority={n === 0}
        />
      ))}
    </>
  );
}

function StoryViewer({
  stories,
  startAt,
  onClose,
}: {
  stories: Story[];
  startAt: number;
  onClose: () => void;
}) {
  const [si, setSi] = useState(startAt);
  const [pi, setPi] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const story = stories[si];
  const photos = story?.photos ?? [];

  const next = useCallback(() => {
    setPi((p) => {
      if (p + 1 < photos.length) return p + 1;
      // End of this story, roll into the next one, or close on the last.
      setSi((s) => {
        if (s + 1 < stories.length) return s + 1;
        onClose();
        return s;
      });
      return 0;
    });
  }, [photos.length, stories.length, onClose]);

  const prev = useCallback(() => {
    setPi((p) => {
      if (p > 0) return p - 1;
      setSi((s) => Math.max(0, s - 1));
      return 0;
    });
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused || photos.length === 0) return;
    const t = setTimeout(next, HOLD_MS);
    return () => clearTimeout(t);
  }, [si, pi, paused, next, photos.length]);

  // Keyboard + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [next, prev, onClose]);

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/95 flex flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      {/* Progress bars */}
      <div className="flex gap-1 p-3 pt-4 shrink-0">
        {photos.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 bg-cream/25 rounded-full overflow-hidden">
            {i < pi ? (
              <div className="h-full w-full bg-cream rounded-full" />
            ) : i === pi ? (
              // Re-keyed on every advance so the fill animation restarts.
              <div
                key={`${si}-${pi}`}
                className="h-full w-full bg-cream rounded-full origin-left"
                style={{
                  animation: `story-fill ${HOLD_MS}ms linear both`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-2 shrink-0">
        <div className="min-w-0">
          <div className="text-cream font-display text-lg leading-tight truncate">{story.title}</div>
          {story.subtitle && (
            <div className="text-cream/60 text-xs truncate">{story.subtitle}</div>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-cream/80 hover:text-cream text-2xl leading-none px-3 py-1 shrink-0"
        >
          x
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Every photo stays mounted so the swap is a cross-fade rather than a
            flash of empty space, and the active one drifts very slowly -
            enough to feel filmic, not enough to distract from the outfit. */}
        {photos.map((src, n) => (
          <Image
            key={src}
            src={src}
            alt={n === pi ? `${story.title}, ${n + 1}` : ""}
            fill
            sizes="100vw"
            priority={n === 0}
            className="object-contain transition-opacity duration-500"
            style={{
              opacity: n === pi ? 1 : 0,
              animation: n === pi ? `story-drift ${HOLD_MS + 1200}ms ease-out both` : undefined,
            }}
          />
        ))}

        {/* Tap zones: left third goes back, the rest goes forward */}
        <button
          aria-label="Previous"
          onClick={prev}
          className="absolute inset-y-0 left-0 w-1/3 cursor-default"
        />
        <button
          aria-label="Next"
          onClick={next}
          className="absolute inset-y-0 right-0 w-2/3 cursor-default"
        />
      </div>

      <div className="text-center text-cream/40 text-[11px] py-3 shrink-0">
        {pi + 1} / {photos.length}, tap and hold to pause
      </div>
    </div>
  );
}
