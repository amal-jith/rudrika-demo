import Link from "next/link";
import StoryRail, { type Story } from "@/components/StoryRail";

/**
 * The homepage teaser: a rail of story circles, one per event, with a link
 * through to the full gallery.
 */
export default function GallerySection({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">Wearing Rudrika</h2>
          <p className="text-sm text-ink/50 mt-1">
            Weddings, receptions and stage moments, tap to see the stories
          </p>
        </div>
        <Link href="/gallery" className="text-sm underline hover:text-clay">
          View all
        </Link>
      </div>

      <StoryRail stories={stories} />
    </section>
  );
}
