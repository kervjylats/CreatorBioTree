/** Admin role permission helpers — checks if a role has a specific permission. */
import type { AdminRole, AdminAccount } from "@/types";
import { ADMIN_PERMISSIONS } from "@/types";

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

/** Admin account lookup — finds the admin_accounts row for a user_id. Syncs legacy admins on every call. */
export async function getAdminAccount(userId: string): Promise<AdminAccount | null> {
  const { mockStore, getTable, seedAdminAccounts } = await import("@/lib/mocks/mockDataStore");
  seedAdminAccounts();
  const accounts = getTable<AdminAccount>("admin_accounts");
  return accounts.find((a) => a.user_id === userId) ?? null;
}
