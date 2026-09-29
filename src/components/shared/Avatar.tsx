/**
 * Avatar — avatar circle with image + initials fallback (visual half of the
 * getInitials duplication, audit 2026-09-29 #2/trivial). Default is the neutral
 * `bg-foreground/10` circle used across Network/circle/chat lists; themed
 * variants (brand colors, borders, shadow) stay hand-rolled at their sites.
 */
import { getInitials } from "@/lib/fan-helpers";

interface AvatarProps {
  /** Avatar URL — renders an <img> when present, initials otherwise. */
  src?: string | null;
  /** Name used for alt text + initials. */
  name: string;
  /** Tailwind size classes (default `h-10 w-10`). */
  size?: string;
  /** Initials font size class (default `text-xs`). */
  textClass?: string;
  /** Extra classes (e.g. `shrink-0` is already included). */
  className?: string;
}

export function Avatar({ src, name, size = "h-10 w-10", textClass = "text-xs", className = "" }: AvatarProps) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/10 font-bold text-foreground ${textClass} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
