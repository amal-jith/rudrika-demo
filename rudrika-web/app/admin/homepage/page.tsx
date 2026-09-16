import Link from "next/link";
import { db } from "@/lib/db";
import { SECTION_DEFS, defFor, parseData } from "@/lib/section-types";
import { HERO_TEMPLATES } from "@/lib/hero-templates";
import { addSection, reorderSections, toggleSectionById } from "@/lib/admin-actions";
import SectionList from "@/components/admin/SectionList";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminHomepage({ searchParams }: { searchParams: { saved?: string } }) {
  await guardPage("homepage");
  const sections = await db.homeSection.findMany({ orderBy: { sort: "asc" } });

  const rows = sections.map((s) => {
    const def = defFor(s.type);
    const d = parseData(s.data, s.type);
    const hint =
      s.type === "HERO"
        ? `, ${d.template} design, ${Array.isArray(d.slides) ? d.slides.length : 1} slide(s)`
        : d.heading
        ? `, “${d.heading}”`
        : d.title
        ? `, “${d.title}”`
        : "";
    return {
      id: s.id,
      title: s.title,
      typeLabel: def?.label ?? s.type,
      hint,
      enabled: s.enabled,
    };
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Homepage Builder</h1>
      <p className="text-sm text-ink/60 mb-6">
        Every block on your homepage, in order. Drag to rearrange, hide one temporarily, or edit its
        words and pictures.{" "}
        <Link href="/" target="_blank" className="underline text-clay">View homepage</Link>
      </p>

      {searchParams.saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-5 text-sm">
          Saved. Your homepage has been updated.
        </div>
      )}

      <SectionList rows={rows} reorder={reorderSections} toggle={toggleSectionById} />

      <div className="admin-card mt-8">
        <h2 className="font-display text-xl mb-1">Add a new block</h2>
        <p className="text-sm text-ink/60 mb-4">It gets added at the bottom, drag it up after.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SECTION_DEFS.map((def) => (
            <form key={def.type} action={addSection} className="border border-ink/10 p-4 hover:border-gold transition-colors">
              <input type="hidden" name="type" value={def.type} />
              <div className="font-medium text-sm">{def.label}</div>
              <div className="text-xs text-ink/50 mt-0.5 mb-3 leading-relaxed">{def.description}</div>

              {def.type === "HERO" && (
                <div className="mb-3">
                  <label className="label">Choose a design</label>
                  <select name="template" defaultValue="atelier-dark" className="input !py-2 text-xs">
                    {HERO_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button className="btn-outline !py-1.5 !px-4 text-xs">+ Add</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
