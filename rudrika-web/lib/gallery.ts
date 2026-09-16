/**
 * Gallery stories, real events the boutique dressed.
 *
 * Reads are wrapped so that a site running before the migration simply shows
 * no gallery rather than erroring, exactly like the shipping zones do.
 */

import { db } from "./db";

export type Story = {
  id: string;
  title: string;
  subtitle: string | null;
  story: string | null;
  photos: string[];
};

function safePhotos(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.filter((s) => typeof s === "string" && s) : [];
  } catch {
    return [];
  }
}

export async function getStories(): Promise<Story[]> {
  try {
    const rows = await db.galleryStory.findMany({
      where: { enabled: true },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    });
    return rows
      .map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        story: r.story,
        photos: safePhotos(r.photos),
      }))
      // The only reason to hide a story is that it has nothing to show.
      // It used to also require a cover image for the circles, those are
      // gone now, so that condition would only have hidden stories for a
      // reason no longer visible anywhere in the admin.
      .filter((s) => s.photos.length > 0);
  } catch {
    return [];
  }
}
