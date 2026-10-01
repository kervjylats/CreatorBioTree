/** Admin role permission helpers — checks if a role has a specific permission. */
import type { AdminRole, AdminAccount } from "@/types";
import { ADMIN_PERMISSIONS } from "@/types";

/** Display names for admin roles — ONE map (AccountsTable vs ServiceAccessDialog had drifted: "Support Admin"/"Support"). */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  content_admin: "Content Admin",
  agent: "Agent",
};

/** Every valid role value — routes validate against this instead of a private literal copy. */
export const ADMIN_ROLES = Object.keys(ROLE_LABELS) as AdminRole[];

/** True when `value` is one of the known roles. */
export function isAdminRole(value: string): value is AdminRole {
  return Object.prototype.hasOwnProperty.call(ROLE_LABELS, value);
}

/** Rank for privilege ordering — used to pick the strongest row when a user has several. */
const ROLE_RANK: Record<AdminRole, number> = {
  super_admin: 4,
  support_admin: 3,
  content_admin: 2,
  agent: 1,
};

/** Get all permission strings for a given admin role. */
export function getPermissionsForRole(role: AdminRole): string[] {
  return ADMIN_PERMISSIONS[role] ?? [];
}

/** Check if a role has a specific permission. */
export function hasPermission(role: AdminRole, permission: string): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/** Check if an admin account can perform a specific action. */
export function canPerform(admin: AdminAccount, permission: string): boolean {
  return hasPermission(admin.role, permission);
}

/**
 * Admin account lookup — the admin_accounts row for a user_id. Syncs legacy admins
 * on every call.
 *
 * A user can own more than one row: POST /api/admin/api-keys inserts an `agent`
 * row under the caller's own user_id. Returning whichever row happened to be first
 * meant a super_admin could resolve to their own `agent` key and silently lose
 * every permission the moment they generated a key — so take the strongest role.
 */
export async function getAdminAccount(userId: string): Promise<AdminAccount | null> {
  const { mockStore, getTable, seedAdminAccounts } = await import("@/lib/mocks/mockDataStore");
  seedAdminAccounts();
  void mockStore;
  const accounts = getTable<AdminAccount>("admin_accounts").filter((a) => a.user_id === userId);
  if (accounts.length === 0) return null;
  return accounts.reduce((strongest, candidate) =>
    (ROLE_RANK[candidate.role] ?? 0) > (ROLE_RANK[strongest.role] ?? 0) ? candidate : strongest,
  );
}
