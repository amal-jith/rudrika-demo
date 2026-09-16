import Link from "next/link";
import Logo from "./Logo";
import { STORE as BASE } from "@/lib/store-config";
import { WhatsAppIcon, InstagramIcon, MailIcon, SocialLink } from "./Icons";

type StoreLike = Awaited<ReturnType<typeof import("@/lib/settings").getStore>>;

const SHOP: [string, string][] = [
  ["/products", "All sarees"],
  ["/products?category=silk", "Silk"],
  ["/products?category=banarasi-and-georgette", "Banarasi and Georgette"],
  ["/products?category=tussar-silk", "Tussar Silk"],
  ["/products?category=linen", "Linen"],
  ["/products?category=cotton", "Cotton"],
  ["/products?category=kota-doria", "Kota Doria"],
  ["/collections", "Collections"],
];
const CARE: [string, string][] = [
  ["/track", "Track your order"],
  ["/shipping-policy", "Shipping policy"],
  ["/returns", "Returns and refunds"],
  ["/size-guide", "Saree guide"],
  ["/faq", "Questions and answers"],
  ["/account/circle", "Rudrika Circle"],
];
const INFO: [string, string][] = [
  ["/about", "Our story"],
  ["/letters", "Letters from Tara"],
  ["/gallery", "Wearing Rudrika"],
  ["/p/styling", "Styled by Rudrika"],
  ["/contact", "Contact"],
  ["/privacy-policy", "Privacy policy"],
  ["/terms", "Terms of service"],
];

export default function Footer({ store }: { store?: StoreLike }) {
  const STORE = (store ?? BASE) as any;
  const trust = [
    ["Handcrafted sarees", "Woven by artisans, chosen by Tara"],
    ["Free shipping", `On orders above ${STORE.shipping.freeAbove}`],
    ["Across India", `Delivered in ${STORE.shipping.delivery}`],
    ["WhatsApp support", "A real person, every working day"],
  ];
  return (
    <footer className="bg-ink text-cream/80 mt-20">
      <div className="border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-sm">
          {trust.map(([t, s]) => (
            <div key={t}>
              <div className="text-cream font-medium">{t}</div>
              <div className="text-xs text-cream/50 mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4"><Logo src={STORE.logo} className="h-16" white /></div>
          <p className="text-sm leading-relaxed max-w-xs text-cream/60">{STORE.tagline}. Sarees that celebrate India's textile heritage, from our boutique in Ernakulam to your wardrobe.</p>
          <div className="flex gap-3 mt-5">
            <SocialLink href={STORE.social.instagram} label="Rudrika on Instagram" dark><InstagramIcon /></SocialLink>
            <SocialLink href={`https://wa.me/${STORE.whatsapp}`} label="Chat with us on WhatsApp" dark><WhatsAppIcon className="w-5 h-5" /></SocialLink>
            <SocialLink href={`mailto:${STORE.email}`} label={`Email ${STORE.email}`} dark><MailIcon /></SocialLink>
          </div>
        </div>
        {[["Shop", SHOP], ["Customer care", CARE], ["Rudrika", INFO]].map(([h, links]) => (
          <div key={h as string} className="text-sm space-y-2.5">
            <div className="uppercase tracking-widest text-xs text-gold-light/70 mb-3">{h as string}</div>
            {(links as [string, string][]).map(([href, label]) => <div key={href}><Link href={href} className="hover:text-cream">{label}</Link></div>)}
            {h === "Rudrika" && (
              <div className="pt-3 text-xs text-cream/50 leading-relaxed">{STORE.branches[0].address}<br />{STORE.whatsappDisplay}<br />{STORE.email}</div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-cream/10 py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-cream/40 tracking-widest text-center">
        <span>{new Date().getFullYear()} Rudrika. Rudrika is a registered trademark. All rights reserved.</span>
        <span className="text-cream/30">UPI, cards, net banking and wallets via Razorpay</span>
        <span className="tracking-wide normal-case">Built by <a href="https://ryzenforge.com/" target="_blank" rel="noopener noreferrer" className="text-gold-light hover:text-cream underline underline-offset-2">Ryzenforge</a></span>
      </div>
    </footer>
  );
}
