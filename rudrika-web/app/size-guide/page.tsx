import PageShell, { Card } from "@/components/PageShell";
import { STORE, waLink } from "@/lib/store-config";
import { WhatsAppIcon } from "@/components/Icons";

export const metadata = { title: "Saree guide" };

const FABRICS: [string, string][] = [
  ["Silk", "Rich, structured drape with a natural sheen. Dry clean only. Store folded in muslin, refold every few months so the zari does not crease."],
  ["Banarasi and Georgette", "Fine, flowing weaves with brocade or zari work. Dry clean. Keep away from perfume and direct sunlight."],
  ["Tussar Silk", "Textured, matte silk with a soft gold tone. Dry clean. Iron on low from the reverse."],
  ["Linen", "Breathable and light, softens with every wash. Gentle hand wash in cold water, dry in shade, iron while slightly damp."],
  ["Cotton", "Everyday comfort. Hand wash separately the first time, mild detergent, dry in shade."],
  ["Kota Doria", "Sheer, checked, feather light. Hand wash gently, never wring, iron on low."],
];

export default function SareeGuide() {
  return (
    <PageShell title="Saree guide" subtitle="Lengths, blouse pieces and how to care for each weave.">
      <Card title="What you receive">
        <ul className="list-disc pl-5 space-y-1 text-sm text-ink/75">
          <li>Sarees are 5.5 metres unless the product page says otherwise, and are one size.</li>
          <li>Where a blouse piece is included, it is listed under Fabric and details. Blouse pieces are unstitched.</li>
          <li>Fall and pico are not included. Any tailor can add them; allow a day.</li>
          <li>Colours are photographed in daylight. Small differences between screens are natural.</li>
        </ul>
      </Card>
      <Card title="Care by fabric">
        <div className="divide-y divide-ink/5 text-sm">
          {FABRICS.map(([f, c]) => <div key={f} className="py-3 grid sm:grid-cols-[160px_1fr] gap-1 sm:gap-4"><div className="font-medium">{f}</div><div className="text-ink/70">{c}</div></div>)}
        </div>
      </Card>
      <div className="bg-clay text-cream p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div><div className="font-display text-2xl">Not sure which weave suits the occasion?</div><p className="text-cream/75 text-sm mt-1">Tara and the team answer on WhatsApp every working day.</p></div>
        <a href={waLink("Hello Rudrika by Tara, I would like help choosing a saree.")} target="_blank" rel="noopener noreferrer" className="btn bg-cream text-clay hover:bg-gold-light inline-flex items-center gap-2 shrink-0"><WhatsAppIcon className="w-5 h-5" /> Ask on WhatsApp {STORE.whatsappDisplay}</a>
      </div>
    </PageShell>
  );
}
