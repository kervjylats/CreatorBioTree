/**
 * fan-helpers.ts — shared utility functions for fan shell components.
 * Eliminates duplicated patterns across FanHomeTab, FanConnectTab, etc.
 */

/** Extract up to 2 initials from a display name. */
export function getInitials(name: string): string {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
