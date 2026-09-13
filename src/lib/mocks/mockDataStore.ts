/** TODO: Add purpose docstring. */
/**
 * mockDataStore.ts
 *
 * HMR-safe in-memory relational data store that backs mockSupabaseClient.
 *
 * Why globalThis?
 *   Next.js hot-reloads server modules on every save. A module-level `Map`
 *   would be recreated on each reload, wiping any data the user created in
 *   the running session. By attaching the store to `globalThis` we keep the
 *   same Map instance across reloads — and we never write to disk, so we
 *   don't trip Next's file-watcher into an infinite compile-reload loop.
 *
 * All seeded rows strictly conform to the domain types in `src/types/index.ts`.
 * No `any`, no shape drift.
 *
 * PRODUCTION-NOTE: Real Supabase requires:
 *   - SQL migration files (CREATE TABLE) for every table in TableName
 *   - Row-Level Security (RLS) policies matching access patterns in mockSupabaseClient
 *   - Foreign key constraints and indexes
 *   - Storage buckets (avatars, content) created in Supabase dashboard
 *   - RPC (stored procedure) definitions for all 7 mocked RPCs
 * The TableName type union IS the schema — each entry needs a real table.
 */

// ─── Table registry ──────────────────────────────────────────────────────────
//
// Every table the codebase touches is enumerated here. Adding a new table is
// a one-line change, and the registry doubles as a type-safe list of valid
// `from(table)` targets for the fluent mock client.

export type TableName =
  | "creators"
  | "content_items"
  | "fan_accounts"
  | "fan_purchases"
  | "partnerships"
  | "partner_invites"
  | "page_views"
  | "fan_installs"
  | "push_subscriptions"
  | "content_comments"
  | "content_reactions"
  | "course_modules"
  | "course_lessons"
  | "fan_sessions"
  | "admin_accounts"
  // ── Messaging (messaging.md Part 5) ──
  | "conversations"
  | "conversation_members"
  | "messages"
  | "message_attachments"
  | "message_requests"
  | "blocked_users"
  | "communities"
  | "chat_prefs"
  // ── Team (team.md) ──
  | "creator_team_members"
  | "creator_team_invites"
  | "creator_team_activity"
  // ── Fan follows (fan-shell.md Part 4c + partner-page.md) ──
  | "fan_follows"
  // ── Affiliates (network.md §7 + monetization/creators.md Part 2f) ──
  | "affiliate_deals"
  | "affiliate_attributions"
  | "affiliate_conversions"
  | "affiliate_links";

// ─── Exported helpers ────────────────────────────────────────────────────────

export function uuid(): string {
  return "mock-" + crypto.randomUUID();
}

// ─── globalThis store ─────────────────────────────────────────────────────────

type StoreMap = Map<TableName, unknown[]>;

const globalForDataStore = globalThis as unknown as {
  __MOCK_DATA_STORE__?: StoreMap;
};

export const mockStore: StoreMap =
  globalForDataStore.__MOCK_DATA_STORE__ ?? new Map<TableName, unknown[]>();

if (process.env.NODE_ENV !== "production") {
  globalForDataStore.__MOCK_DATA_STORE__ = mockStore;
}

// ─── Initialise all tables to empty ──────────────────────────────────────────

function initStore(): void {
  mockStore.set("creators", []);
  mockStore.set("content_items", []);
  mockStore.set("fan_accounts", []);
  mockStore.set("fan_purchases", []);
  mockStore.set("partnerships", []);
  mockStore.set("partner_invites", []);
  mockStore.set("page_views", []);
  mockStore.set("fan_installs", []);
  mockStore.set("push_subscriptions", []);
  mockStore.set("fan_sessions", []);
  mockStore.set("content_comments", []);
  mockStore.set("content_reactions", []);
  mockStore.set("course_modules", []);
  mockStore.set("course_lessons", []);
  mockStore.set("admin_accounts", []);
  mockStore.set("conversations", []);
  mockStore.set("conversation_members", []);
  mockStore.set("messages", []);
  mockStore.set("message_attachments", []);
  mockStore.set("message_requests", []);
  mockStore.set("blocked_users", []);
  mockStore.set("communities", []);
  mockStore.set("chat_prefs", []);
  mockStore.set("creator_team_members", []);
  mockStore.set("creator_team_invites", []);
  mockStore.set("creator_team_activity", []);
  mockStore.set("fan_follows", []);
  mockStore.set("affiliate_deals", []);
  mockStore.set("affiliate_attributions", []);
  mockStore.set("affiliate_conversions", []);
  mockStore.set("affiliate_links", []);
}

export function seedAdminAccounts(): void {
  const creators = getTable<Record<string, unknown>>("creators");
  const admins = getTable<Record<string, unknown>>("admin_accounts");
  for (const c of creators) {
    if (c.role === "admin" && !admins.some((a) => a.user_id === c.id)) {
      admins.push({
        id: `admin-${c.id}`,
        user_id: c.id,
        role: "super_admin",
        permissions: {},
        api_key: null,
        created_at: c.created_at ?? new Date().toISOString(),
        updated_at: c.updated_at ?? new Date().toISOString(),
      });
    }
  }
}

if (mockStore.size === 0) {
  initStore();
  seedAdminAccounts();
}

export function resetMockStore(): void {
  mockStore.clear();
  initStore();
}

// ─── Low-level typed accessors (used by the fluent mock client) ──────────────

/** Return a typed reference to a table's rows. Mutations persist in-place. */
export function getTable<T = unknown>(name: TableName): T[] {
  const rows = mockStore.get(name);
  if (!rows) {
    const fresh: T[] = [];
    mockStore.set(name, fresh as unknown[]);
    return fresh;
  }
  return rows as T[];
}

/** Replace a whole table's contents (used by delete/upsert operations). */
export function setTable<T = unknown>(name: TableName, rows: T[]): void {
  mockStore.set(name, rows as unknown[]);
}