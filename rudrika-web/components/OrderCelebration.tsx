"use client";

import { useEffect, useState } from "react";

const COLOURS = ["#b08a3e", "#7b2135", "#d4b878", "#a04a5c", "#f3ecdd"];

export default function OrderCelebration({ orderNumber }: { orderNumber: number }) {
  const [show, setShow] = useState(true);
  const [pieces, setPieces] = useState<{ l: number; d: number; c: string; dur: number; w: number }[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 40 }).map(() => ({
        l: Math.random() * 100,
        d: Math.random() * 1.5,
        c: COLOURS[Math.floor(Math.random() * COLOURS.length)],
        dur: 2.5 + Math.random() * 2,
        w: 6 + Math.random() * 6,
      }))
    );
    const t = setTimeout(() => setShow(false), 5200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      {/* confetti */}
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden>
          {pieces.map((p, i) => (
            <span
              key={i}
              className="absolute top-0 rounded-[1px]"
              style={{
                left: `${p.l}%`,
                width: p.w,
                height: p.w * 1.6,
                background: p.c,
                animation: `confettiFall ${p.dur}s ease-in ${p.d}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* success card */}
      <div
        className="bg-white border border-gold/30 px-6 py-8 mb-8 text-center"
        style={{ animation: "popIn 0.6s cubic-bezier(.2,.8,.3,1.2) both" }}
      >
        <svg viewBox="0 0 52 52" className="w-16 h-16 mx-auto mb-4">
          <circle cx="26" cy="26" r="24" fill="none" stroke="#b08a3e" strokeWidth="2" opacity="0.35" />
          <circle
            cx="26" cy="26" r="24" fill="none" stroke="#7b2135" strokeWidth="2"
            strokeDasharray="151" strokeDashoffset="151" strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{ animation: "drawCheck 0.9s ease-out 0.15s forwards" }}
          />
          <path
            d="M15 27 L23 34 L38 19" fill="none" stroke="#7b2135" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="40" strokeDashoffset="40"
            style={{ animation: "drawCheck 0.5s ease-out 0.75s forwards" }}
          />
        </svg>
        <h2 className="font-display text-3xl">Thank you!</h2>
        <div className="gold-divider"><span className="gold-dot" /></div>
        <p className="text-ink/65 text-sm max-w-md mx-auto">
          Your order <strong>#{orderNumber}</strong> has been placed successfully. We'll send tracking
          details on WhatsApp once it ships.
        </p>
      </div>
    </div>
  );
}
