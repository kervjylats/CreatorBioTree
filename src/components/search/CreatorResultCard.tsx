/**
 * CreatorResultCard — search result card (search.md Part 2). Shows avatar,
 * display name, @link-address, tagline, and a "Visit" button. Used by
 * SearchBar (shared) and Network DiscoverCreators (Sheet 18).
 */
import Link from "next/link";

export interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  is_featured: boolean | null;
}

interface CreatorResultCardProps {
  result: SearchResult;
  onSelect?: (username: string) => void;
}

export function CreatorResultCard({ result, onSelect }: CreatorResultCardProps) {
  const href = `/${result.username}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30">
      {/* Avatar */}
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold text-foreground overflow-hidden">
        {result.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.avatar_url} alt={result.display_name} className="h-full w-full object-cover" />
        ) : (
          result.display_name
            .split(/[\s@._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("")
        )}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-foreground">{result.display_name}</span>
          {result.is_featured && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-micro font-bold text-amber-700">
              Featured
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">@{result.username}</span>
        {result.tagline && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">{result.tagline}</p>
        )}
      </div>

      {/* Visit button */}
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(result.username)}
          className="shrink-0 rounded-full border border-input px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        >
          Visit
        </button>
      ) : (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-input px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        >
          Visit
        </Link>
      )}
    </div>
  );
}
