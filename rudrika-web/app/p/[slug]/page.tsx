import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PageShell, { Card } from "@/components/PageShell";
import { PAGE_SEEDS } from "@/lib/page-defaults";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const page = await db.page.findUnique({ where: { slug } });
  if (page && page.enabled) {
    let blocks: { heading: string; body: string }[] = [];
    try {
      blocks = JSON.parse(page.blocks);
    } catch {}
    return { title: page.title, subtitle: page.subtitle ?? "", blocks };
  }
  const seed = PAGE_SEEDS.find((p) => p.slug === slug);
  return seed ? { title: seed.title, subtitle: seed.subtitle, blocks: seed.blocks } : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  return { title: p?.title ?? "Page" };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  return (
    <PageShell title={p.title} subtitle={p.subtitle}>
      {p.blocks.map((b, i) => (
        <Card key={i} title={b.heading}>
          <p className="whitespace-pre-line">{b.body}</p>
        </Card>
      ))}
    </PageShell>
  );
}
