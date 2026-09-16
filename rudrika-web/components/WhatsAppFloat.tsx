"use client";

import { usePathname } from "next/navigation";

export default function WhatsAppFloat({ number }: { number: string }) {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hi Rudrika, I have a question about your sarees."
  )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed z-50 bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 flex items-center justify-center hover:scale-110 transition-transform"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="w-8 h-8">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4.2 28l6.3-2c1.7.9 3.5 1.4 5.5 1.4 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1.2 1.2-3.6-.3-.4c-1.1-1.6-1.7-3.5-1.7-5.5 0-5.4 4.4-9.8 9.9-9.8s9.9 4.4 9.9 9.8-4.4 9.9-9.9 9.9zm5.5-7.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
      </svg>
    </a>
  );
}
