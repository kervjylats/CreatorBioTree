/**
 * CreatorShowcase — auto-scrolling "Creators already on BioTree" marquee on
 * the landing page (landing.md Phase 4). Pure CSS animation (duplicated track,
 * seamless -50% loop), pauses on hover/focus, honors prefers-reduced-motion.
 * Renders nothing with fewer than 2 creators (smart live-stack rule).
 */
import Link from "next/link";
import { Avatar } from "@/components/shared/Avatar";

export interface ShowcaseCreator {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function CreatorShowcase({ creators }: { creators: ShowcaseCreator[] }) {
  if (creators.length < 2) return null;
  // Duplicate the list for a seamless loop; each card carries its own
  // trailing margin (not a flex gap) so both halves are exactly equal.
  const track = [...creators, ...creators];

  return (
    <section
      aria-label="Creators on BioTree"
      className="py-12 sm:py-16 border-t border-border"
    >
      <div className="max-w-2xl mx-auto px-6 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-3">
          Creators already on BioTree
        </h2>
        <p className="text-muted-foreground">
          Every fan who opens one of these links gets an installable app.
        </p>
      </div>

      <div className="showcase-mask">
        <div className="showcase-track">
          {track.map((c, i) => (
            <Link
              key={`${c.username}-${i}`}
              href={`/${c.username}`}
              aria-hidden={i >= creators.length || undefined}
              tabIndex={i >= creators.length ? -1 : undefined}
              className="mr-3 inline-flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent/30"
            >
              <Avatar src={c.avatar_url} name={c.display_name || c.username} size="h-10 w-10" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground">
                  {c.display_name || c.username}
                </span>
                <span className="block truncate text-xs text-muted-foreground">@{c.username}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
