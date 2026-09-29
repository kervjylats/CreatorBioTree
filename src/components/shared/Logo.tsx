/** Logo — the shared BioTree brand mark (Trees icon in a primary box + optional wordmark). Single source so auth, landing, and sidebar branding stay in sync. */
import { Trees } from "lucide-react";

interface LogoProps {
  /** Trees icon size in px — the icon box is rendered at 2× this. */
  size?: number;
  /** Optional wordmark text rendered beside the icon. */
  wordmark?: string;
  /** Root container classes (layout, gap, margins). */
  className?: string;
  /** Icon box classes — override rounding (e.g. "rounded-2xl"). */
  boxClassName?: string;
  /** Wordmark classes — override the default serif display style. */
  wordmarkClassName?: string;
}

export function Logo({
  size = 20,
  wordmark,
  className = "flex items-center gap-3",
  boxClassName = "rounded-xl",
  wordmarkClassName = "font-serif text-2xl font-bold tracking-tight text-foreground",
}: LogoProps) {
  return (
    <span className={className}>
      <span
        className={`flex shrink-0 items-center justify-center bg-primary text-white shadow-sm ${boxClassName}`}
        style={{ width: size * 2, height: size * 2 }}
      >
        <Trees size={size} />
      </span>
      {wordmark && <span className={wordmarkClassName}>{wordmark}</span>}
    </span>
  );
}
