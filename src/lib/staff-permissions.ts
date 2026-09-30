/**
 * staff-permissions.ts — single source of truth for staff permission keys,
 * labels, and warning flags. Used by PermissionsToggles and StaffRow.
 */

export interface StaffPermission {
  key: string;
  label: string;
  warning: boolean;
}

export const STAFF_PERMISSIONS: StaffPermission[] = [
  { key: "content", label: "Content", warning: false },
  { key: "stats", label: "Overview & Stats", warning: false },
  { key: "relationships", label: "Relationships", warning: false },
  { key: "messages", label: "Messages", warning: false },
  { key: "community", label: "Community", warning: false },
  { key: "network", label: "Network", warning: false },
  { key: "settings", label: "Settings", warning: true },
  { key: "money", label: "Money", warning: true },
];

/** Permission key → display label map (for StaffRow). */
export const STAFF_PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  STAFF_PERMISSIONS.map((p) => [p.key, p.label]),
);
