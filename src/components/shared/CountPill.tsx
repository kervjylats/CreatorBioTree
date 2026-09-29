/**
 * CountPill — the red unread badge (duplication audit 2026-09-29 trivial sweep:
 * the dock badge was byte-identical in MyPeeps + MessagesShell, the row badge a
 * third copy). "dock" = absolute corner badge with 99+ cap · "row" = inline
 * list badge (no cap). Visibility guards (`count > 0`) stay at the call site.
 */

interface CountPillProps {
  count: number;
  /** dock = corner badge (h-5, 99+ cap) · row = inline badge (h-4, no cap). */
  variant?: "dock" | "row";
  className?: string;
}

export function CountPill({ count, variant = "dock", className = "" }: CountPillProps) {
  if (variant === "row") {
    return (
      <span
        className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-micro font-bold text-white ${className}`}
      >
        {count}
      </span>
    );
  }
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-caption font-bold text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
