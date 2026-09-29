/**
 * EmptyState — shared empty-state markup (duplication audit 2026-09-29 #18).
 * `variant="box"` = the dashed-border card used across lists (Network, admin,
 * circle); `variant="inline"` = the one-line muted message used in compact
 * popovers (messaging inbox, deal cards). Pattern source: src/old-code/EmptyState.tsx,
 * restyled to live tokens.
 */

interface EmptyStateProps {
  /** Main line ("No deals yet"). */
  title: string;
  /** Optional second line (smaller, muted). */
  hint?: string;
  /** Optional action (button/link) rendered below. */
  action?: React.ReactNode;
  /** box = dashed card · inline = plain muted line. */
  variant?: "box" | "inline";
  className?: string;
}

export function EmptyState({ title, hint, action, variant = "box", className = "" }: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <p className={`px-4 py-8 text-center text-sm text-muted-foreground ${className}`}>{title}</p>
    );
  }
  return (
    <div className={`rounded-xl border border-dashed border-border p-10 text-center ${className}`}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
