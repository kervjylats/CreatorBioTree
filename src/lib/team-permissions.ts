/**
 * team-permissions.ts — single source of truth for team permission keys,
 * labels, and warning flags. Used by PermissionsToggles and TeamRow.
 */

export interface TeamPermission {
  key: string;
  label: string;
  warning: boolean;
}

export const TEAM_PERMISSIONS: TeamPermission[] = [
  { key: "content", label: "Content", warning: false },
  { key: "stats", label: "Overview & Stats", warning: false },
  { key: "relationships", label: "Relationships", warning: false },
  { key: "messages", label: "Messages", warning: false },
  { key: "community", label: "Community", warning: false },
  { key: "network", label: "Network", warning: false },
  { key: "settings", label: "Settings", warning: true },
  { key: "money", label: "Money", warning: true },
];

/** Permission key → display label map (for TeamRow). */
export const TEAM_PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  TEAM_PERMISSIONS.map((p) => [p.key, p.label]),
);
