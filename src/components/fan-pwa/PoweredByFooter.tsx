/**
 * PoweredByFooter — "Powered by CreatorBioTree" link (fan-shell.md Part 6).
 * Themed with the creator's branding so it blends into the fan shell;
 * auto-hidden in edit mode (Playground preview) via the `hidden` prop.
 */
import type { CreatorBranding } from "@/lib/branding";

interface PoweredByFooterProps {
  branding?: CreatorBranding;
  hidden?: boolean;
}

export function PoweredByFooter({ branding, hidden }: PoweredByFooterProps) {
  if (hidden) return null;
  const textColor = branding ? branding.textColor + "66" : undefined;
  return (
    <footer className="pt-6 text-center">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs"
        style={textColor ? { color: textColor } : undefined}
      >
        Powered by CreatorBioTree
      </a>
    </footer>
  );
}