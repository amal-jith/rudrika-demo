import PageShell from "@/components/PageShell";
import { STORE } from "@/lib/store-config";

export const metadata = { title: "Questions and answers" };

const FAQS: [string, string][] = [
  ["Are the sarees handwoven?", "Most pieces are handwoven or hand finished by artisan clusters we work with directly. The fabric and weave are described on every product page, and silk pieces carry the Silk Mark where certified."],
  ["Does the saree come with a blouse piece?", "Where a blouse piece is included, the product page says so under Fabric and details. Fall and pico are not included unless mentioned."],
  ["How long does delivery take?", `Orders are dispatched in ${STORE.shipping.dispatch} and delivered across India in ${STORE.shipping.delivery}. Pre-order pieces are made to order and take 3 to 4 weeks.`],
  ["Is shipping free?", `Shipping is free on orders above ${STORE.shipping.freeAbove}. Below that it is ${STORE.shipping.perSaree} per saree. We ship within India only.`],
  ["Can I return or exchange a saree?", STORE.returns + " Colour differences due to screens and lighting are not defects."],
  ["Is cash on delivery available?", "No. We accept UPI, cards, net banking and wallets through Razorpay's secure checkout."],
  ["How do I track my order?", "Use Track your order in the footer with your order number and phone, or sign in and open My orders. You also receive updates on WhatsApp if you opted in."],
  ["What is Rudrika Circle?", "A yearly membership with a member discount on every order, free shipping, early access to new pieces and a styling session with Tara. Join from your account."],
  ["How do loyalty points work?", "You earn points on every delivered order and can redeem them at checkout. Approved reviews and wearing photos earn extra. See Loyalty points in your account."],
  ["Can I visit the boutique?", `Yes. ${STORE.branches[0].address}. Message us on WhatsApp at ${STORE.whatsappDisplay} before you come and we will keep pieces ready for you.`],
];

export default function FaqPage() {
  return (
    <PageShell title="Questions and answers" subtitle="Everything you need to know about shopping with Rudrika by Tara.">
      <div className="space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="bg-white border border-gold/20 group">
            <summary className="cursor-pointer p-5 font-medium text-sm flex justify-between items-center gap-4">{q}<span className="text-gold shrink-0 group-open:rotate-45 transition-transform">+</span></summary>
            <p className="px-5 pb-5 text-sm text-ink/70 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
