import Image from "next/image";
import { getStore } from "@/lib/settings";
import { STORE as BASE } from "@/lib/store-config";
import { WhatsAppIcon, InstagramIcon, MailIcon, SocialLink } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact Us" };

const STORE_PHOTOS = ["/uploads/campaign/rich-band-about.jpg", "/uploads/campaign/editorial-3.jpg"];

export default async function ContactPage() {
  const STORE = await getStore();
  const wa = (text: string) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <div>
      {/* ── Hero with store photo ── */}
      <section className="relative min-h-[45vh] sm:min-h-[55vh] flex items-end text-cream overflow-hidden">
        <Image src={STORE_PHOTOS[1]} alt="Inside Rudrika by Tara" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/20" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-16 w-full">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-gold-light mb-3">
            Visit, call or WhatsApp
          </div>
          <h1 className="font-display text-3xl sm:text-5xl leading-tight">
            Come see it <em className="text-gold-light">in person.</em>
          </h1>
          <p className="mt-4 text-cream/75 text-sm sm:text-base max-w-lg">
            One boutique in Ernakulam, a wall of handwoven sarees, and Tara's team to help you find
            the one that is yours.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* ── Branches with photos ── */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {STORE.branches.map((b, i) => (
            <div key={b.name} className="bg-white border border-gold/20 overflow-hidden flex flex-col">
              <div className="relative aspect-[16/10] zoom-frame overflow-hidden">
                <Image
                  src={STORE_PHOTOS[i % STORE_PHOTOS.length]}
                  alt={b.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4">
                  <div className="font-display text-xl text-cream">{b.name}</div>
                </div>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <p className="text-sm text-ink/70 leading-relaxed">{b.address}</p>
                <p className="text-sm mt-3">
                  <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-clay underline">{b.phone}</a>
                  <br />
                  <a href={`mailto:${b.email}`} className="text-clay underline break-all">{b.email}</a>
                </p>
                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gold/15">
                  <a href={b.map} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !px-4 text-xs">
                    Get directions
                  </a>
                  <a
                    href={wa(`Hello Rudrika by Tara, I would like to visit the boutique. Is it open today?`)}
                    target="_blank" rel="noopener noreferrer"
                    className="btn !py-2 !px-4 text-xs bg-[#25D366] text-white hover:bg-[#1da851] inline-flex items-center gap-1.5"
                  >
                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick help ── */}
        <div className="bg-clay text-cream p-6 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="font-display text-2xl sm:text-3xl">Need help choosing?</div>
            <p className="text-cream/75 text-sm mt-2 max-w-md">
              Colour advice, blouse pairing, gifting or order tracking. Message us and a real person
              replies, usually within minutes during working hours.
            </p>
          </div>
          <a
            href={wa("Hello Rudrika by Tara, I need some help choosing.")}
            target="_blank" rel="noopener noreferrer"
            className="btn bg-cream text-clay hover:bg-gold-light shrink-0 inline-flex items-center gap-2"
          >
            <WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp
          </a>
        </div>

        {/* ── Other numbers + hours ── */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white border border-gold/20 p-5 sm:p-6">
            <h2 className="font-display text-xl mb-3">Other enquiries</h2>
            <div className="text-sm space-y-2 text-ink/75">
              {BASE.otherPhones.map((p) => (
                <p key={p.phone} className="flex justify-between gap-3">
                  <span>{p.label}</span>
                  <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="text-clay underline shrink-0">{p.phone}</a>
                </p>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gold/20 p-5 sm:p-6">
            <h2 className="font-display text-xl mb-3">Hours and socials</h2>
            <p className="text-sm text-ink/75">{STORE.hours}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <SocialLink href={STORE.social.instagram} label="Rudrika on Instagram">
                <InstagramIcon />
              </SocialLink>
              <SocialLink href={wa("Hello Rudrika by Tara,")} label="Chat with us on WhatsApp">
                <WhatsAppIcon className="w-5 h-5" />
              </SocialLink>
              <SocialLink href={`mailto:${STORE.email}`} label={`Email ${STORE.email}`}>
                <MailIcon />
              </SocialLink>
            </div>
            <p className="text-xs text-ink/50 mt-3 break-all">{STORE.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
