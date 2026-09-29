/**
 * YourCreatorsRow — returning-fan row on the landing page (landing.md:
 * "Your creators", founder decision 2026-08-08). Shows the creators a
 * recognized fan/follower has accounts with; server-only render, never a
 * hint of existence for logged-out visitors (privacy rule in the spec).
 */
import Link from "next/link";
import { Avatar } from "@/components/shared/Avatar";
import { LABEL_CLASS } from "@/lib/ui-constants";

export interface FollowedCreator {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function YourCreatorsRow({ creators }: { creators: FollowedCreator[] }) {
  if (creators.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-10 pt-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className={LABEL_CLASS}>Your creators</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {creators.map((c) => (
            <Link
              key={c.username}
              href={`/${c.username}`}
              className="inline-flex w-44 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center transition-colors hover:bg-accent/30"
            >
              <Avatar src={c.avatar_url} name={c.display_name || c.username} size="h-12 w-12" textClass="text-sm" />
              <span className="min-w-0 w-full">
                <span className="block truncate text-sm font-bold text-foreground">
                  {c.display_name || c.username}
                </span>
                <span className="block truncate text-xs text-primary">Open app &rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
