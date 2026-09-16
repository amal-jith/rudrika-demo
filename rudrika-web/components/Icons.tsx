/**
 * Brand + UI icons as inline SVG.
 *
 * Inline rather than an icon library so they cost zero extra network requests
 * and inherit `currentColor` from whatever button they sit in.
 *
 * Every icon accepts a className; default sizing is 1em so it lines up with
 * the text next to it without any manual nudging.
 */

type P = { className?: string };

const base = "inline-block shrink-0 align-[-0.15em]";

/** Official WhatsApp glyph (phone handset inside a speech bubble). */
export function WhatsAppIcon({ className = "w-[1.15em] h-[1.15em]" }: P) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4.2 28l6.3-2c1.7.9 3.5 1.4 5.5 1.4 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1.2 1.2-3.6-.3-.4c-1.1-1.6-1.7-3.5-1.7-5.5 0-5.4 4.4-9.8 9.9-9.8s9.9 4.4 9.9 9.8-4.4 9.9-9.9 9.9zm5.5-7.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.1-1.1.1-1.7.2-2.1.3-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.1.4-.3 1-.3 2.1-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.7.3 2.1.2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.1 1 .3 2.1.3 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.7-.2 2.1-.3.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.1-.4.3-1 .3-2.1.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.1-1-.3-2.1-.3C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 8a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2zm6.3-8.2a1.15 1.15 0 11-2.3 0 1.15 1.15 0 012.3 0z" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

export function MailIcon({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={`${base} ${className}`}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M3 6.5l9 6.5 9-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneIcon({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`${base} ${className}`}>
      <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 3.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.4 0 .8-.2 1l-2.2 2.2z" />
    </svg>
  );
}

/** Small circular icon button used for socials in the footer / contact page. */
export function SocialLink({
  href,
  label,
  children,
  dark = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={
        "w-10 h-10 rounded-full border flex items-center justify-center transition-colors " +
        (dark
          ? "border-cream/25 text-cream/75 hover:bg-cream hover:text-ink hover:border-cream"
          : "border-gold/40 text-clay hover:bg-clay hover:text-cream hover:border-clay")
      }
    >
      {children}
    </a>
  );
}

/* Line icons shared by the header, mobile bar and product cards so the same
   heart appears everywhere. All take the current text colour. */
const L = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export function HeartIcon({ className = "w-5 h-5", filled = false }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.4 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" />
    </svg>
  );
}
export function HomeIcon({ className = "w-5 h-5" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M10 20v-5h4v5" /></svg>;
}
export function ShopIcon({ className = "w-5 h-5" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><path d="M4 9h16l-1 11H5L4 9z" /><path d="M4 9l1.5-4h13L20 9" /><path d="M9 13v3M15 13v3" /></svg>;
}
export function BagIcon({ className = "w-5 h-5" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
}
export function UserIcon({ className = "w-5 h-5" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>;
}
export function SearchIcon({ className = "w-5 h-5" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
}
export function MenuIcon({ className = "w-6 h-6" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}
export function ChevronIcon({ className = "w-3 h-3" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L}><path d="m6 9 6 6 6-6" /></svg>;
}
export function StarIcon({ className = "w-4 h-4", filled = true }: P & { filled?: boolean }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L} fill={filled ? "currentColor" : "none"}><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3z" /></svg>;
}
export function CheckIcon({ className = "w-4 h-4" }: P) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...L} strokeWidth={2.2}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
}
