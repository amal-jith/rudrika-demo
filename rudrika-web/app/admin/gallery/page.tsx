import { db } from "@/lib/db";
import { saveGalleryStory, deleteGalleryStory } from "@/lib/admin-actions";
import StoryPhotosField from "@/components/admin/StoryPhotosField";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };

function photosOf(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default async function AdminGallery() {
  await guardPage("gallery");
  let stories: Awaited<ReturnType<typeof db.galleryStory.findMany>> = [];
  let migrated = true;
  try {
    stories = await db.galleryStory.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  } catch {
    migrated = false;
  }

  if (!migrated)
    return (
      <div>
        <h1 className="font-display text-3xl mb-4">Gallery</h1>
        <div className="admin-card">
          <p className="text-sm text-ink/70">
            The gallery table hasn&apos;t been created yet. Run the v12 migration on the server,
            then reload this page.
          </p>
        </div>
      </div>
    );

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Gallery</h1>
      <p className="text-sm text-ink/55 mb-6 max-w-2xl">
        Each story is one event, a wedding, a reception, an anchoring gig, and appears as its
        own section on <strong>/gallery</strong>. Use <strong>Add photos</strong> to upload more,
        Remove on a photo to remove it, and the arrows to reorder; the first photo
        runs large at the top of the section. Nothing is saved until you press{" "}
        <strong>Save</strong>. A story with no photos is hidden from the site automatically, so
        you can set one up now and fill it in later.
      </p>

      <div className="space-y-4 mb-8">
        {stories.map((s) => {
          const photos = photosOf(s.photos);
          return (
            <div key={s.id} className="admin-card">
              <form action={saveGalleryStory} className="space-y-4">
                <input type="hidden" name="id" value={s.id} />

                <div className="grid sm:grid-cols-[1fr_1fr_90px] gap-3">
                  <div>
                    <label className="label">Event name</label>
                    <input name="title" defaultValue={s.title} className="input !py-2" required />
                  </div>
                  <div>
                    <label className="label">Caption (optional)</label>
                    <input
                      name="subtitle"
                      defaultValue={s.subtitle ?? ""}
                      className="input !py-2"
                      placeholder="Wedding, Munnar"
                    />
                  </div>
                  <div>
                    <label className="label">Order</label>
                    <input name="sort" type="number" defaultValue={s.sort} className="input !py-2" />
                  </div>
                </div>

                <div>
                  <label className="label">The story (optional)</label>
                  <textarea
                    name="story"
                    defaultValue={(s as any).story ?? ""}
                    rows={4}
                    className="input !py-2"
                    placeholder="A paragraph about the day, who wore what, where it was, what made it special. Shown above the photos on the gallery page."
                  />
                </div>

                <div>
                  <label className="label">Photos in this story</label>
                  <StoryPhotosField name="photos" defaultValue={photos} />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="enabled" defaultChecked={s.enabled} />
                    Show on the site
                  </label>
                  <button className="btn-primary !py-2 !px-5 text-sm">Save</button>
                  <span className="text-xs text-ink/40">
                    {photos.length} photo{photos.length === 1 ? "" : "s"}
                  </span>
                </div>
              </form>

              <form action={deleteGalleryStory} className="mt-3 pt-3 border-t border-ink/10">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs underline text-ink/50 hover:text-red-600">
                  Delete this story
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="admin-card">
        <div className="font-display text-xl mb-4">Add a story</div>
        <form action={saveGalleryStory} className="space-y-4">
          <div className="grid sm:grid-cols-[1fr_1fr_90px] gap-3">
            <div>
              <label className="label">Event name</label>
              <input name="title" className="input !py-2" placeholder="Aswathy & Sreerag" required />
            </div>
            <div>
              <label className="label">Caption (optional)</label>
              <input name="subtitle" className="input !py-2" placeholder="Wedding, June 2026" />
            </div>
            <div>
              <label className="label">Order</label>
              <input name="sort" type="number" defaultValue={stories.length} className="input !py-2" />
            </div>
          </div>

          <div>
            <label className="label">The story (optional)</label>
            <textarea
              name="story"
              rows={4}
              className="input !py-2"
              placeholder="A paragraph about the day, who wore what, where it was, what made it special."
            />
          </div>

          <div>
            <label className="label">Photos in this story</label>
            <StoryPhotosField name="photos" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked />
            Show on the site
          </label>

          <button className="btn-primary !py-2 !px-5 text-sm">Add story</button>
        </form>
      </div>
    </div>
  );
}
