/** TODO: Add purpose docstring. */
/**
 * mockSupabaseClient.ts
 *
 * A fluent fake Supabase client that runs entirely off the in-memory
 * `mockDataStore`. It implements exactly the query / auth / storage / rpc
 * surface the BioTree codebase uses — no more, no less.
 *
 * Design rules (from project strategy):
 *  • No general-purpose SQL parser. Join resolution is handled by a small,
 *    table-keyed registry of hardcoded mappers (REFINEMENT 2).
 *  • The returned object is cast to `SupabaseClient` once at the boundary,
 *    keeping the import sites (`createClient()` / `createServiceClient()`)
 *    unchanged. No `any` casts inside business logic; only the SDK's own
 *    `data` payload uses `any` because the real SDK exposes `any` there.
 *  • The store lives on `globalThis` so HMR reloads never wipe it.
 *
 * PRODUCTION-NOTE: Real Supabase provides:
 *   - Row-Level Security (RLS) — mock bypasses this; real needs policies
 *   - Auth email verification flows (password reset, etc.)
 *   - Storage CDN with signed URLs and transformations
 *   - Real-time subscriptions (WebSocket-based)
 *   - SQL functions and triggers for complex queries
 *   - Proper UUID validation (mock accepts non-UUID IDs when USE_MOCKS=true)
 *   - GraphQL via pg_graphql extension
 * The mock's query surface (from, select, eq, order, etc.) and return shape
 * ({ data, error }) must be replicated exactly. RLS policies should mirror
 * the access patterns hardcoded here (e.g., owner-only updates, public reads).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getTable, setTable, type TableName } from "./mockDataStore";
import type { Creator, ContentItem } from "@/types";

// ─── Auth state (kept on globalThis so it survives HMR) ──────────────────────

interface MockAuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown> | null;
}

const globalForAuth = globalThis as unknown as {
  __MOCK_AUTH_USER__?: MockAuthUser;
  __MOCK_AUTH_USERS__?: Map<string, MockAuthUser>;
};

const currentAuthUser: MockAuthUser = globalForAuth.__MOCK_AUTH_USER__ ?? {
  id: "",
  email: "",
  user_metadata: null,
};
globalForAuth.__MOCK_AUTH_USER__ = currentAuthUser;

const authUsers: Map<string, MockAuthUser> =
  globalForAuth.__MOCK_AUTH_USERS__ ?? new Map<string, MockAuthUser>();
globalForAuth.__MOCK_AUTH_USERS__ = authUsers;

// ─── Query result types ──────────────────────────────────────────────────────
// Matches the real SDK's `{ data, error }` payload shape.

interface MockResult<TData = unknown> {
  data: TData | null;
  error: { message: string } | null;
}

// ─── Filter representation ───────────────────────────────────────────────────

interface Filter {
  col: string;
  op:
    | "eq"
    | "neq"
    | "in"
    | "like"
    | "ilike"
    | "contains"
    | "gte"
    | "or"
    | "is"
    | "not";
  val: unknown;
}

interface OrderSpec {
  col: string;
  ascending: boolean;
}

// ─── Select-spec parser (REFINEMENT 2 — minimal, hardcoded) ───────────────────
//
// Splits a PostgREST-style select string into top-level fields + join specs.
// We do NOT build a SQL AST. We do a single paren-aware comma split, then look
// up the requested joins in a per-table registry below.

interface JoinSpec {
  /** Output field name on the row. Defaults to the fk column name. */
  alias: string;
  /** Column on the current row that holds the related row's id. */
  fkColumn: string;
  /** Table name to read the related row from. */
  joinTable: TableName;
  /** Fields to project onto the joined object, or null for "*" (full row). */
  fields: string[] | null;
}

interface ParsedSelect {
  fields: string[] | null; // null == "*"
  joins: JoinSpec[];
}

// Which fk columns, on which source tables, resolve to which related table.
// Keys are aliases used in select() strings; each entry gives the real FK column
// name on the source table and the target table to join against.
interface JoinEntry {
  fkColumn: string;
  table: TableName;
}

const JOIN_REGISTRY: Partial<
  Record<TableName, Partial<Record<string, JoinEntry>>>
> = {
  content_items: { creators: { fkColumn: "creator_id", table: "creators" } },
  fan_accounts: {
    creators: { fkColumn: "creator_id", table: "creators" },
    referred_by: { fkColumn: "referred_by", table: "creators" },
  },
  fan_purchases: {
    creators: { fkColumn: "creator_id", table: "creators" },
    content_items: { fkColumn: "content_item_id", table: "content_items" },
  },
  partnerships: {
    creator_a: { fkColumn: "creator_a", table: "creators" },
    creator_b: { fkColumn: "creator_b", table: "creators" },
  },
  content_comments: {
    fan_accounts: { fkColumn: "fan_id", table: "fan_accounts" },
  },
  course_modules: {
    creators: { fkColumn: "creator_id", table: "creators" },
    content_items: { fkColumn: "course_id", table: "content_items" },
  },
  course_lessons: {
    course_modules: { fkColumn: "module_id", table: "course_modules" },
  },
};

function parseSelectSpec(
  table: TableName,
  cols: string | undefined,
): ParsedSelect {
  const safeCols = cols ?? "*";
  if (!safeCols.includes("(") && !safeCols.includes(":")) {
    // No joins requested — only "*" or a plain column list.
    if (safeCols.trim() === "*") return { fields: null, joins: [] };

    // Special-case: the search query on creators passes a comma list with
    // no parens — we don't strictly need column projection downstream
    // (callers cast), so we still treat it as "*" for simplicity, except
    // we still respect it as "all columns" by returning null fields.
    return { fields: null, joins: [] };
  }

  // Paren-aware comma split.
  const segments: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of safeCols) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      segments.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) segments.push(buf);

  const fields: string[] = [];
  const joins: JoinSpec[] = [];
  const registry = JOIN_REGISTRY[table];

  for (const raw of segments) {
    const seg = raw.trim();
    if (!seg) continue;

    const parenIdx = seg.indexOf("(");
    if (parenIdx === -1) {
      if (seg === "*") continue; // fields == null already implied
      fields.push(seg);
      continue;
    }

    // "alias:fkName (a, b, c)" or "fkName (a, b, c)"
    const before = seg.slice(0, parenIdx).trim();
    const inside = seg.slice(parenIdx + 1, seg.lastIndexOf(")")).trim();

    let alias = before;
    let fkColumn = before;
    const colonIdx = before.indexOf(":");
    if (colonIdx !== -1) {
      alias = before.slice(0, colonIdx).trim();
      fkColumn = before.slice(colonIdx + 1).trim();
    }

    // Handle PostgREST constraint-name disambiguation: `<table>!<constraint>(cols)`
    // Constraint names follow convention `<srcTable>_<fkCol>_fkey`.
    const bangIdx = fkColumn.indexOf("!");
    if (bangIdx !== -1) {
      const maybeJoinTable = fkColumn.slice(0, bangIdx).trim();
      const constraint = fkColumn.slice(bangIdx + 1).trim();
      const srcPrefix = `${table}_`;
      if (constraint.startsWith(srcPrefix) && constraint.endsWith("_fkey")) {
        const fkCol = constraint.slice(srcPrefix.length, -"_fkey".length);
        const matches = Object.values(registry ?? {}).some(
          (e) => e?.fkColumn === fkCol,
        );
        if (matches) {
          if (alias === before) alias = maybeJoinTable;
          // Registry is keyed by alias names (e.g. "creators"),
          // not FK column names (e.g. "creator_id"). Find the alias.
          const entry = Object.entries(registry ?? {}).find(
            ([, v]) => v?.fkColumn === fkCol,
          );
          fkColumn = entry ? entry[0] : fkCol;
        }
      }
    }

    const joinEntry = registry?.[fkColumn];
    if (!joinEntry) continue; // unknown join — silently skip

    const projectedFields =
      inside === "*" ? null : inside.split(",").map((s) => s.trim());

    joins.push({ alias, fkColumn: joinEntry.fkColumn, joinTable: joinEntry.table, fields: projectedFields });
  }

  return { fields: fields.length ? fields : null, joins };
}

function projectRow(row: unknown, fields: string[] | null): unknown {
  if (!row || fields === null) return row;
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f] = (row as Record<string, unknown>)[f];
  return out;
}

function applyJoins(
  table: TableName,
  rows: Record<string, unknown>[],
  joins: JoinSpec[],
): Record<string, unknown>[] {
  if (joins.length === 0) return rows;

  // Pre-load related tables once per call for speed.
  const loadedTables = new Map<TableName, unknown[]>();
  for (const j of joins) {
    if (!loadedTables.has(j.joinTable)) {
      loadedTables.set(j.joinTable, getTable(j.joinTable));
    }
  }

  return rows.map((row) => {
    const out: Record<string, unknown> = { ...row };
    for (const j of joins) {
      const related = loadedTables
        .get(j.joinTable)!
        .find((r) => (r as Record<string, unknown>).id === row[j.fkColumn]);
      out[j.alias] = related ? projectRow(related, j.fields) : null;
    }
    return out;
  });
}

// ─── Filter evaluation ────────────────────────────────────────────────────────

function likeToRegExp(pattern: string, caseInsensitive: boolean): RegExp {
  // PostgREST LIKE: % → .*, _ → .
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(caseInsensitive ? `^${body}$` : `^${body}$`, caseInsensitive ? "i" : "");
}

function matchFilter(row: Record<string, unknown>, f: Filter): boolean {
  const val = row[f.col];
  switch (f.op) {
    case "eq":
      return val === f.val;
    case "neq":
      return val !== f.val;
    case "is":
      return f.val === null ? val === null : val === f.val;
    case "in":
      return Array.isArray(f.val) && f.val.includes(val);
    case "like":
      return typeof val === "string" && likeToRegExp(String(f.val), false).test(val);
    case "ilike":
      return typeof val === "string" && likeToRegExp(String(f.val), true).test(val);
    case "contains":
      return Array.isArray(val) && Array.isArray(f.val) && f.val.every((v) => val.includes(v));
    case "gte":
      return (val as unknown as string | number) >= (f.val as string | number);
    case "or": {
      // f.val is an array of sub-filters; OR them.
      const subs = f.val as Filter[];
      return subs.some((s) => matchFilter(row, s));
    }
    case "not": {
      // f.val is { col, op, val } — negate the inner filter
      const inner = f.val as Filter;
      return !matchFilter(row, inner);
    }
  }
}

function matchRow(row: unknown, filters: Filter[]): boolean {
  const r = row as Record<string, unknown>;
  return filters.every((f) => matchFilter(r, f));
}

// ─── Query builder ───────────────────────────────────────────────────────────

type Mode = "select" | "insert" | "update" | "upsert" | "delete";

class MockQueryBuilder implements PromiseLike<MockResult> {
  private table: TableName | null = null;
  private mode: Mode = "select";
  private selectCols: string | undefined;
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitN: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  // ── entry points ──
  from(table: string): this {
    this.table = table as TableName;
    this.mode = "select";
    return this;
  }

  select(cols?: string): this {
    this.selectCols = cols;
    this.mode = this.mode === "select" ? "select" : this.mode;
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.payload = rows;
    this.mode = "insert";
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.payload = values;
    this.mode = "update";
    return this;
  }

  upsert(
    rows: Record<string, unknown>,
    opts?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): this {
    this.payload = rows;
    this.mode = "upsert";
    this.upsertOpts = opts ?? {};
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  // ── chainable mutator methods ──
  eq(col: string, val: unknown): this {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  neq(col: string, val: unknown): this {
    this.filters.push({ col, op: "neq", val });
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this.filters.push({ col, op: "in", val: vals });
    return this;
  }

  like(col: string, val: string): this {
    this.filters.push({ col, op: "like", val });
    return this;
  }

  ilike(col: string, val: string): this {
    this.filters.push({ col, op: "ilike", val });
    return this;
  }

  contains(col: string, val: unknown[]): this {
    this.filters.push({ col, op: "contains", val });
    return this;
  }

  gte(col: string, val: unknown): this {
    this.filters.push({ col, op: "gte", val });
    return this;
  }

  or(clauses: string): this {
    // "col.op.val,col.op.val" — comma-separated, OR-combined.
    const subs: Filter[] = clauses.split(",").map((c) => {
      const [col, op, ...valParts] = c.split(".");
      const val = valParts.join(".");
      return {
        col: col.trim(),
        op: op.trim() as Filter["op"],
        val: _coerceValue(val.trim()),
      };
    });
    this.filters.push({ col: "", op: "or", val: subs });
    return this;
  }

  not(col: string, op: string, val: unknown): this {
    this.filters.push({ col, op: "not", val: { col, op, val } });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  // ── terminal shape modifiers ──
  single(): PromiseLike<MockResult> {
    this.isSingle = true;
    return Promise.resolve(this.execute());
  }

  maybeSingle(): PromiseLike<MockResult> {
    this.isMaybeSingle = true;
    return Promise.resolve(this.execute());
  }

  // ── thenable interface — lets callers `await supabase.from(...)...` ──
  then<TResult1 = MockResult, TResult2 = never>(
    onfulfilled?:
      | ((value: MockResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  // ─── execution ─────────────────────────────────────────────────────────────

  private execute(): MockResult {
    if (!this.table) {
      return { data: null, error: { message: "No table specified" } };
    }
    const rows = getTable<Record<string, unknown>>(this.table);

    switch (this.mode) {
      case "select":
        return this.execSelect(rows);
      case "insert":
        return this.execInsert(rows);
      case "update":
        return this.execUpdate(rows);
      case "upsert":
        return this.execUpsert(rows);
      case "delete":
        return this.execDelete(rows);
      default:
        return { data: null, error: { message: "Unknown mode" } };
    }
  }

  private execSelect(rows: Record<string, unknown>[]): MockResult {
    const matched = rows.filter((r) => matchRow(r, this.filters));
    const ordered = this.applyOrder(matched);
    const limited = this.limitN === null ? ordered : ordered.slice(0, this.limitN);

    const { joins } = parseSelectSpec(this.table!, this.selectCols);
    const joined = applyJoins(this.table!, limited as Record<string, unknown>[], joins);

    return this.shape(joined);
  }

  private execInsert(rows: Record<string, unknown>[]): MockResult {
    const now = new Date().toISOString();
    const payloadArr = Array.isArray(this.payload) ? this.payload : [this.payload!];

    const inserted: Record<string, unknown>[] = [];
    for (const raw of payloadArr) {
      const row = { ...raw } as Record<string, unknown>;
      if (!row.id) row.id = _uuid();
      if (!row.created_at) row.created_at = now;
      if (!row.updated_at) row.updated_at = now;
      rows.push(row);
      inserted.push(row);
    }

    const { joins } = parseSelectSpec(this.table!, this.selectCols);
    const joined = applyJoins(this.table!, inserted, joins);

    return this.shape(joined);
  }

  private execUpdate(rows: Record<string, unknown>[]): MockResult {
    const now = new Date().toISOString();
    const patch = { ...this.payload!, updated_at: now };
    const updated: Record<string, unknown>[] = [];
    for (const row of rows) {
      if (matchRow(row, this.filters)) {
        Object.assign(row, patch);
        updated.push(row);
      }
    }

    const joined = this.selectCols
      ? applyJoins(this.table!, updated, parseSelectSpec(this.table!, this.selectCols).joins)
      : [];

    return this.shape(joined);
  }

  private execUpsert(rows: Record<string, unknown>[]): MockResult {
    const now = new Date().toISOString();
    const incoming = { ...this.payload! } as Record<string, unknown>;
    const conflictKeys = this.upsertOpts.onConflict?.split(",").map((s) => s.trim()) ?? [];
    const ignore = this.upsertOpts.ignoreDuplicates === true;

    const existing = conflictKeys.length
      ? rows.find((r) => conflictKeys.every((k) => r[k] === incoming[k]))
      : rows.find((r) => r.id === incoming.id);

    let row: Record<string, unknown>;
    if (existing) {
      if (!ignore) Object.assign(existing, { ...incoming, updated_at: now });
      row = existing;
    } else {
      row = { ...incoming };
      if (!row.id) row.id = _uuid();
      if (!row.created_at) row.created_at = now;
      if (!row.updated_at) row.updated_at = now;
      rows.push(row);
    }

    const joined = this.selectCols
      ? applyJoins(this.table!, [row], parseSelectSpec(this.table!, this.selectCols).joins)
      : [row];

    return this.shape(joined);
  }

  private execDelete(rows: Record<string, unknown>[]): MockResult {
    const remaining = rows.filter((r) => !matchRow(r, this.filters));
    setTable(this.table!, remaining);
    // Supabase returns null data unless a select() was chained before delete.
    return this.shape([]);
  }

  // ── helpers ──
  private applyOrder(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (this.orders.length === 0) return rows;
    const sorted = [...rows];
    sorted.sort((a, b) => {
      for (const o of this.orders) {
        const av = a[o.col] as string | number | undefined;
        const bv = b[o.col] as string | number | undefined;
        if (av === bv) continue;
        const cmp: number =
          av === undefined || av === null
            ? -1
            : bv === undefined || bv === null
              ? 1
              : av < bv
                ? -1
                : 1;
        if (cmp !== 0) return o.ascending ? cmp : -cmp;
      }
      return 0;
    });
    return sorted;
  }

  private shape(rows: Record<string, unknown>[]): MockResult {
    if (this.isSingle) {
      if (rows.length === 0)
        return { data: null, error: { message: "No rows found" } };
      if (rows.length > 1)
        return { data: null, error: { message: "Multiple rows found" } };
      return { data: rows[0], error: null };
    }
    if (this.isMaybeSingle) {
      if (rows.length > 1)
        return { data: null, error: { message: "Multiple rows found" } };
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }
}

// ─── value coercion for `.or()` raw string values ────────────────────────────

function _coerceValue(raw: string): unknown {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

function _uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "mock-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── RPC handlers ─────────────────────────────────────────────────────────────

function rpcHandler(name: string, args: Record<string, unknown>): MockResult {
  function isMockAdmin(uid: string): boolean {
    const adminAccounts = getTable<Record<string, unknown>>("admin_accounts");
    return adminAccounts.some((a) => a.user_id === uid);
  }
  switch (name) {
    case "get_creator_stats": {
      const creatorId = args.p_creator_id as string;
      const contentCount = getTable<ContentItem>("content_items").filter(
        (c) => c.creator_id === creatorId,
      ).length;
      const views = getTable("page_views") as unknown as Array<{
        creator_id: string;
      }>;
      const viewCount = views.filter((v) => v.creator_id === creatorId).length;
      const installs = getTable("fan_installs") as unknown as Array<{
        creator_id: string;
      }>;
      const installCount = installs.filter((i) => i.creator_id === creatorId).length;
      const fanCount = getTable("fan_accounts").filter(
        (f) => (f as Record<string, unknown>).creator_id === creatorId,
      ).length;
      const revenue = getTable("fan_purchases")
        .filter(
          (p) =>
            (p as Record<string, unknown>).creator_id === creatorId &&
            (p as Record<string, unknown>).status === "completed",
        )
        .reduce<number>(
          (sum, p) => sum + Number((p as Record<string, unknown>).amount_paid ?? 0),
          0,
        );
      return {
        data: [
          {
            view_count: viewCount,
            install_count: installCount,
            content_count: contentCount,
            fan_count: fanCount,
            total_revenue: revenue,
          },
        ],
        error: null,
      };
    }

    case "get_creator_analytics": {
      const creatorId = args.p_creator_id as string;
      const content = getTable<ContentItem>("content_items").filter(
        (c) => c.creator_id === creatorId,
      );
      const views = getTable("page_views") as unknown as Array<{
        creator_id: string;
        viewed_at: string;
      }>;
      const installs = getTable("fan_installs") as unknown as Array<{
        creator_id: string;
        installed_at: string;
      }>;
      const fans = getTable("fan_accounts").filter(
        (f) => (f as Record<string, unknown>).creator_id === creatorId,
      );
      const revenue = getTable("fan_purchases")
        .filter(
          (p) =>
            (p as Record<string, unknown>).creator_id === creatorId &&
            (p as Record<string, unknown>).status === "completed",
        )
        .reduce<number>(
          (sum, p) => sum + Number((p as Record<string, unknown>).amount_paid ?? 0),
          0,
        );

      return {
        data: {
          totalViews: views.filter((v) => v.creator_id === creatorId).length,
          viewsThisWeek: 0,
          viewsLastWeek: 0,
          totalInstalls: installs.filter((i) => i.creator_id === creatorId).length,
          installsThisWeek: 0,
          totalFans: fans.length,
          totalRevenue: revenue,
          topContent: content.map((c) => ({
            title: c.title,
            clicks: 0,
            type: c.type,
          })),
          viewsByDay: [],
        },
        error: null,
      };
    }

    case "get_creator_activity": {
      // Lightweight activity feed: most-recent fans + purchases for this creator.
      const creatorId = args.p_creator_id as string;
      const fans = getTable("fan_accounts")
        .filter((f) => (f as Record<string, unknown>).creator_id === creatorId)
        .map((f) => ({
          type: "fan_joined",
          email: (f as Record<string, unknown>).email,
          created_at: (f as Record<string, unknown>).created_at,
        }));
      const purchases = getTable("fan_purchases")
        .filter((p) => (p as Record<string, unknown>).creator_id === creatorId)
        .map((p) => ({
          type: "purchase",
          amount: (p as Record<string, unknown>).amount_paid,
          created_at: (p as Record<string, unknown>).purchased_at,
        }));
      return { data: [...fans, ...purchases], error: null };
    }

    case "get_creator_partnership_stats": {
      const creatorId = args.p_creator_id as string;
      const fans_referred = getTable("fan_accounts").filter(
        (f) => (f as Record<string, unknown>).referred_by === creatorId,
      ).length;
      const referredFanIds = getTable("fan_accounts")
        .filter((f) => (f as Record<string, unknown>).referred_by === creatorId)
        .map((f) => (f as Record<string, unknown>).id);
      const referred_revenue = getTable("fan_purchases")
        .filter(
          (p) =>
            referredFanIds.includes(
              (p as Record<string, unknown>).fan_id,
            ) &&
            (p as Record<string, unknown>).status === "completed",
        )
        .reduce<number>(
          (sum, p) => sum + Number((p as Record<string, unknown>).amount_paid ?? 0),
          0,
        );
      const active_partners = getTable("partnerships").filter(
        (p) =>
          (p as Record<string, unknown>).creator_a === creatorId &&
          (p as Record<string, unknown>).status === "active",
      ).length;
      const pending_requests = getTable("partnerships").filter(
        (p) =>
          (p as Record<string, unknown>).creator_b === creatorId &&
          (p as Record<string, unknown>).status === "pending",
      ).length;

      return {
        data: [
          {
            fans_referred,
            referred_revenue,
            active_partners,
            pending_requests,
          },
        ],
        error: null,
      };
    }

    case "create_my_creator_profile": {
      const userId = currentAuthUser.id;
      const creators = getTable<Creator>("creators");
      const existing = creators.find((c) => c.id === userId);
      const now = new Date().toISOString();

      const profile = {
        id: userId,
        username: String(args.p_username ?? "creator"),
        display_name: String(args.p_display_name ?? "Creator"),
        bio: args.p_bio ? String(args.p_bio) : null,
        email: args.p_email ? String(args.p_email) : currentAuthUser.email ?? null,
        role: "creator" as const,
        country: null,
        is_discoverable: false,
        is_featured: false,
        tags: [],
        niches: args.p_niche ? [String(args.p_niche)] : [],
        niche: args.p_niche ? String(args.p_niche) : null,
        tagline: null,
        collab_style: null,
        connect_empty_text: null,
        metadata: {},
        theme_id: "minimal",
        custom_theme: null,
        remove_branding: false,
        push_notifications_enabled: false,
        social_links: null,
        social_screenshots: {},
        ai_summary: null,
        avatar_url: null,
        banner_url: null,
        custom_domain: null,
        preferred_subdomain: null,
        subdomain_active: false,
        plan: "free" as const,
        stripe_account_id: null,
        lemon_order_id: null,
        payout_method: "stripe" as const,
        payout_email: null,
        payoneer_id: null,
        paypal_email: null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      if (existing) {
        Object.assign(existing, profile);
      } else {
        creators.push(profile as Creator);
      }
      return { data: null, error: null };
    }

    case "get_admin_stats": {
      if (!isMockAdmin(currentAuthUser.id)) {
        return { data: null, error: { message: "Forbidden" } };
      }
      const allCreators = getTable<Creator>("creators");
      const adminUserIds = new Set(
        getTable<Record<string, unknown>>("admin_accounts").map((a) => a.user_id as string)
      );
      const nonAdminCreators = allCreators.filter((c) => !adminUserIds.has(c.id));
      const fans = getTable("fan_accounts");
      const revenue = getTable("fan_purchases").reduce<number>(
        (sum, p) =>
          sum +
          Number((p as Record<string, unknown>).amount_paid ?? 0),
        0,
      );
      return {
        data: {
          totalCreators: nonAdminCreators.length,
          totalFans: fans.length,
          totalRevenue: revenue,
          proCreators: nonAdminCreators.filter((c) => c.plan === "pro").length,
          freeCreators: nonAdminCreators.filter((c) => c.plan === "free").length,
        },
        error: null,
      };
    }

    case "get_admin_creators": {
      if (!isMockAdmin(currentAuthUser.id)) {
        return { data: null, error: { message: "Forbidden" } };
      }
      const adminUserIds = new Set(
        getTable<Record<string, unknown>>("admin_accounts").map((a) => a.user_id as string)
      );
      return {
        data: getTable<Creator>("creators").filter((c) => !adminUserIds.has(c.id)),
        error: null,
      };
    }

    default:
      return { data: null, error: { message: `Unknown RPC: ${name}` } };
  }
}

// ─── Mock storage ─────────────────────────────────────────────────────────────

interface MockStorageApi {
  upload(
    path: string,
    body: ArrayBuffer | Buffer | Blob | Uint8Array,
    opts?: { contentType?: string; cacheControl?: string; upsert?: boolean },
  ): Promise<MockResult<{ path: string }>>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  createSignedUrl(
    path: string,
    _expiresIn: number,
  ): Promise<MockResult<{ signedUrl: string }>>;
}

function makeStorageApi(): Record<string, MockStorageApi> {
  const api: MockStorageApi = {
    async upload(path, body) {
      try {
        // Dynamic import keeps `fs` out of the browser bundle.
        const fs = await import("node:fs/promises");
        const nodePath = await import("node:path");
        const uploadDir = nodePath.join(process.cwd(), "public", "mock-uploads");
        const full = nodePath.join(uploadDir, path);
        await fs.mkdir(nodePath.dirname(full), { recursive: true });
        const buf = bodyToBuffer(body);
        await fs.writeFile(full, buf);
        return { data: { path }, error: null };
      } catch (err) {
        return { data: null, error: { message: String(err) } };
      }
    },
    getPublicUrl(path) {
      return { data: { publicUrl: `/mock-uploads/${path}` } };
    },
    async createSignedUrl(path) {
      return { data: { signedUrl: `/mock-uploads/${path}` }, error: null };
    },
  };
  return new Proxy(
    {} as Record<string, MockStorageApi>,
    {
      get(_t, prop) {
        if (typeof prop === "string") return api;
        return undefined;
      },
    },
  );
}

function bodyToBuffer(
  body: ArrayBuffer | Buffer | Blob | Uint8Array,
): Buffer {
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  // Blob — rare in server context, but convert via arrayBuffer()
  // (keeps the API surface complete without adding a runtime import).
  return Buffer.from(new Uint8Array(body as unknown as ArrayBuffer));
}

// ─── Mock auth ────────────────────────────────────────────────────────────────

// Shared creator-row shape: used by signUp (browser-side auto-provision), by
// cookie hydration (server-side, see createMockSupabaseClient) and by seeding.
function buildMockCreatorRow(id: string, email: string, displayName: string): Creator {
  return {
    id,
    username: email.split("@")[0],
    display_name: displayName,
    bio: null,
    avatar_url: null,
    banner_url: null,
    email,
    role: "creator",
    country: null,
    is_discoverable: false,
    is_featured: false,
    tags: [],
    niches: [],
    niche: null,
    tagline: null,
    collab_style: null,
    connect_empty_text: null,
    metadata: {},
    theme_id: "minimal",
    custom_theme: null,
    remove_branding: false,
    push_notifications_enabled: true,
    social_links: null,
    social_screenshots: {},
    ai_summary: null,
    custom_domain: null,
    preferred_subdomain: null,
    subdomain_active: false,
    plan: "free",
    stripe_account_id: null,
    lemon_order_id: null,
    payout_method: "stripe",
    payout_email: null,
    payoneer_id: null,
    paypal_email: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies Creator;
}

interface MockAuthResult {
  data: { user: MockAuthUser | null };
  error: { message: string } | null;
}

const mockAuth = {
  getUser(): Promise<MockAuthResult> {
    return Promise.resolve({
      data: { user: currentAuthUser.id ? currentAuthUser : null },
      error: null,
    });
  },

  getSession(): Promise<{
    data: { session: MockAuthUser | null };
    error: null;
  }> {
    return Promise.resolve({
      data: { session: currentAuthUser.id ? currentAuthUser : null },
      error: null,
    });
  },

  signInWithPassword(args: {
    email: string;
    password: string;
  }): Promise<MockAuthResult> {
    const user =
      [...authUsers.values()].find((u) => u.email === args.email.toLowerCase()) ??
      null;
    if (user) {
      // Mutate the module-level currentAuthUser in place so callers keep
      // reading the same reference.
      currentAuthUser.id = user.id;
      currentAuthUser.email = user.email;
      currentAuthUser.user_metadata = user.user_metadata;
    }
    return Promise.resolve({
      data: { user: user ?? null },
      error: user ? null : { message: "Invalid login credentials" },
    });
  },

  signUp(args: {
    email: string;
    password?: string;
    options?: { data?: Record<string, unknown> };
  }): Promise<MockAuthResult> {
    const email = args.email.toLowerCase();
    const existing = [...authUsers.values()].find((u) => u.email === email);
    if (existing) {
      return Promise.resolve({
        data: { user: null },
        error: { message: "User already registered" },
      });
    }
    const id = _uuid();
    const displayName = (args.options?.data?.display_name as string) || "";
    const user: MockAuthUser = {
      id,
      email,
      user_metadata: args.options?.data ?? null,
    };
    authUsers.set(id, user);
    currentAuthUser.id = id;
    currentAuthUser.email = email;
    currentAuthUser.user_metadata = user.user_metadata;
    // Create the creator record in the store
    const creators = getTable<Creator>("creators");
    creators.push(buildMockCreatorRow(id, email, displayName));
    setTable("creators", creators);
    return Promise.resolve({ data: { user }, error: null });
  },

  signOut(): Promise<{ error: null }> {
    return Promise.resolve({ error: null });
  },

  updateUser(args: Record<string, unknown>): Promise<MockAuthResult> {
    // We don't enforce real passwords; the onboarding password step just
    // needs a non-erroring response.
    return Promise.resolve({
      data: { user: currentAuthUser },
      error: null,
    });
  },

  admin: {
    createUser(args: {
      email: string;
      password?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    }): Promise<{
      data: { user: MockAuthUser | null };
      error: { message: string } | null;
    }> {
      const id = _uuid();
      const user: MockAuthUser = {
        id,
        email: args.email.toLowerCase(),
        user_metadata: args.user_metadata ?? null,
      };
      authUsers.set(id, user);
      return Promise.resolve({ data: { user }, error: null });
    },
  },
};

// ─── Public client factory ────────────────────────────────────────────────────

interface MockClient {
  from(table: string): MockQueryBuilder;
  rpc(name: string, args?: Record<string, unknown>): Promise<MockResult>;
  auth: typeof mockAuth;
  storage: {
    from(_bucket: string): MockStorageApi;
  };
}

export function createMockSupabaseClient(
  initialUser?: { id: string; email: string } | null,
): SupabaseClient {
  // On Vercel (server), globalThis isn't shared with the browser.
  // If a cookie-based session was set by the login page, prime the
  // mock auth state so getServerUser / API handlers see a logged-in user.
  if (initialUser?.id) {
    currentAuthUser.id = initialUser.id;
    currentAuthUser.email = initialUser.email;
    // Keep the server-side store consistent with what browser-side signUp
    // created: a cookie session implies a creators row. Without this, the
    // dashboard layout finds no creator and redirects /onboarding while the
    // onboarding screen bounces back to /dashboard/my-app — an infinite loop.
    const creators = getTable<Creator>("creators");
    if (!creators.some((c) => c.id === initialUser.id)) {
      creators.push(buildMockCreatorRow(initialUser.id, initialUser.email, ""));
      setTable("creators", creators);
    }
  } else {
    // NO cookie → NO session for THIS request. currentAuthUser is a module
    // singleton shared by every request in the process, so a previous
    // request's cookie hydration (or sign-in) would leak into cookie-less
    // requests — e.g. a fan API call appearing as the creator (2026-08-13:
    // chat routes resolved fan requests as mock-test-creator). The cookie is
    // authoritative per request (see 2026-07-13 account-switching fix).
    currentAuthUser.id = "";
    currentAuthUser.email = "";
  }

  const client: MockClient = {
    from: (table: string) => new MockQueryBuilder().from(table),
    rpc: (name: string, args: Record<string, unknown> = {}) =>
      Promise.resolve(rpcHandler(name, args)),
    auth: mockAuth,
    storage: {
      from: () => makeStorageApi()[""],
    },
  };

  return client as unknown as SupabaseClient;
}

// ─── Seed: platform owner (admin) ────────────────────────────────────────────
// The mock store starts empty, so there is no admin account to log in with —
// chicken-and-egg. Seed one deterministic admin so the /admin bootstrap works:
//  - an auth user exists (signInWithPassword looks up `authUsers` only)
//  - a creators row with role "admin" (dashboard login + role checks)
//  - an admin_accounts row (proxy + admin permission checks)
// Idempotent: skips everything if the admin email is already registered.

const MOCK_ADMIN_ID = "mock-admin";
const MOCK_ADMIN_EMAIL = "admin@creatorpwa.app";

export function seedMockAdmin(): void {
  if ([...authUsers.values()].some((u) => u.email === MOCK_ADMIN_EMAIL)) return;

  authUsers.set(MOCK_ADMIN_ID, {
    id: MOCK_ADMIN_ID,
    email: MOCK_ADMIN_EMAIL,
    user_metadata: { display_name: "Platform Owner" },
  });

  const now = new Date().toISOString();
  const creators = getTable<Creator>("creators");
  if (!creators.some((c) => c.id === MOCK_ADMIN_ID)) {
    creators.push({
      id: MOCK_ADMIN_ID,
      username: "admin",
      display_name: "Platform Owner",
      bio: null,
      email: MOCK_ADMIN_EMAIL,
      role: "admin",
      country: null,
      is_discoverable: false,
      is_featured: false,
      tags: [],
      niches: [],
      niche: null,
      tagline: null,
      collab_style: null,
      connect_empty_text: null,
      metadata: {},
      theme_id: "minimal",
      custom_theme: null,
      remove_branding: false,
      push_notifications_enabled: true,
      social_links: null,
      social_screenshots: {},
      ai_summary: null,
      avatar_url: null,
      banner_url: null,
      custom_domain: null,
      preferred_subdomain: null,
      subdomain_active: false,
      plan: "free",
      stripe_account_id: null,
      lemon_order_id: null,
      payout_method: "stripe",
      payout_email: null,
      payoneer_id: null,
      paypal_email: null,
      created_at: now,
      updated_at: now,
    } satisfies Creator);
  }

  const admins = getTable<Record<string, unknown>>("admin_accounts");
  if (!admins.some((a) => a.user_id === MOCK_ADMIN_ID)) {
    admins.push({
      id: `admin-${MOCK_ADMIN_ID}`,
      user_id: MOCK_ADMIN_ID,
      role: "super_admin",
      permissions: {},
      api_key: null,
      created_at: now,
      updated_at: now,
    });
  }
}

seedMockAdmin();

// ─── Seed: test creator (mock auto-login) ─────────────────────────────────────
// Mock mode auto-provisions a session for a deterministic test creator so the
// inside-app screens (/dashboard/*) are testable without the login dance.
// Idempotent. REMOVE the auto-login block in proxy.ts during the final auth
// pass — this seed can stay (it's just sample data).

const MOCK_TEST_CREATOR_ID = "mock-test-creator";
const MOCK_TEST_CREATOR_EMAIL = "test@creatorpwa.app";

export function seedMockTestCreator(): void {
  if ([...authUsers.values()].some((u) => u.email === MOCK_TEST_CREATOR_EMAIL)) return;

  authUsers.set(MOCK_TEST_CREATOR_ID, {
    id: MOCK_TEST_CREATOR_ID,
    email: MOCK_TEST_CREATOR_EMAIL,
    user_metadata: { display_name: "Test Creator" },
  });

  const creators = getTable<Creator>("creators");
  if (!creators.some((c) => c.id === MOCK_TEST_CREATOR_ID)) {
    creators.push(buildMockCreatorRow(MOCK_TEST_CREATOR_ID, MOCK_TEST_CREATOR_EMAIL, "Test Creator"));
    setTable("creators", creators);
  }
}

seedMockTestCreator();

// Re-export store helpers so route code/tests can reset the mock cleanly.
export { resetMockStore } from "./mockDataStore";