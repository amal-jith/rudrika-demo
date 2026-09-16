import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { defFor, parseData, CARD_SECTIONS } from "@/lib/section-types";
import { HERO_TEMPLATES } from "@/lib/hero-templates";
import CardsEditor from "@/components/admin/CardsEditor";
import { saveSection, deleteSection } from "@/lib/admin-actions";
import UploadField from "@/components/admin/UploadField";
import HeroSlidesEditor from "@/components/admin/HeroSlidesEditor";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function EditSection({ params }: { params: { id: string } }) {
  await guardPage("homepage");
  const section = await db.homeSection.findUnique({ where: { id: params.id } });
  if (!section) notFound();
  const def = defFor(section.type);
  if (!def) notFound();
  const d = parseData(section.data, section.type);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/homepage" className="text-sm underline text-ink/50 hover:text-clay">Back to homepage blocks</Link>
      <h1 className="font-display text-3xl mt-3 mb-1">{section.title}</h1>
      <p className="text-sm text-ink/60 mb-6">{def.description}</p>

      <form action={saveSection} className="space-y-5">
        <input type="hidden" name="__id" value={section.id} />

        {/* Template picker sits right at the top for hero blocks */}
        {section.type === "HERO" && (
          <div className="bg-sand border border-gold/30 p-4">
            <label className="label">Design template, pick a look</label>
            <select name="template" defaultValue={d.template ?? "atelier-dark"} className="input">
              {HERO_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink/50 mt-2">
              Every design keeps the wording on its own colour panel, so text is always easy to read
              and your photos are never covered.
            </p>
          </div>
        )}

        <div>
          <label className="label">Block name (only you see this)</label>
          <input name="__title" className="input" defaultValue={section.title} />
        </div>

        {section.type === "HERO" && (
          <HeroSlidesEditor initial={Array.isArray(d.slides) ? d.slides : []} />
        )}

        {CARD_SECTIONS.includes(section.type) && (
          <CardsEditor
            initial={Array.isArray(d.cards) ? d.cards : []}
            subtitleLabel={section.type === "PRICE_TIERS" ? "Price line (e.g. Under Rs. 3,000)" : "Small note (optional)"}
          />
        )}

        {def.fields.map((f) => {
          if (section.type === "HERO" && f.name === "template") return null; // shown above
          const value = d[f.name];
          if (f.kind === "image" || f.kind === "video")
            return <UploadField key={f.name} name={f.name} label={f.label} kind={f.kind} defaultValue={value ?? ""} />;

          if (f.kind === "select")
            return (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                <select name={f.name} defaultValue={value ?? ""} className="input">
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            );

          if (f.kind === "boolean")
            return (
              <label key={f.name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={f.name} defaultChecked={!!value} /> {f.label}
              </label>
            );

          if (f.kind === "textarea")
            return (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                <textarea name={f.name} rows={3} className="input" defaultValue={value ?? ""} placeholder={f.placeholder} />
              </div>
            );

          return (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input
                name={f.name}
                type={f.kind === "number" ? "number" : "text"}
                className="input"
                defaultValue={value ?? ""}
                placeholder={f.placeholder}
              />
              {f.help && <p className="text-xs text-ink/40 mt-1">{f.help}</p>}
            </div>
          );
        })}

        <p className="text-xs text-ink/40">
          Tip: for a button that opens WhatsApp, type <code className="bg-sand px-1">whatsapp</code> as the link.
        </p>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary">Save Changes</button>
          <Link href="/admin/homepage" className="btn-outline">Cancel</Link>
        </div>
      </form>

      <form action={deleteSection} className="mt-8 pt-6 border-t border-ink/10">
        <input type="hidden" name="id" value={section.id} />
        <button className="text-sm underline text-red-600">Delete this block permanently</button>
      </form>
    </div>
  );
}
