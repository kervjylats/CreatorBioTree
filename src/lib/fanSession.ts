/**
 * fanSession.ts — central fan session management (fan-shell.md Part 5).
 * Model B (2026-09-23): one `fan_session` cookie holds a JSON map
 * { creatorId → token }. Logging in on one creator auto-recognizes you on
 * every creator's link (same email), yet logging out of one creator leaves
 * the others logged in. Pass creatorId to resolve that creator's token; omit
 * it for generic callers (chat, dashboard) that take any valid session.
 */
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const FAN_SESSION_COOKIE = "fan_session";

interface CookieStoreLike {
  get(name: string): { value: string } | undefined;
}

export interface FanSession {
  email: string;
  fanId: string;
  creatorId: string;
}

const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

export { SESSION_OPTIONS };

/** Max creators tracked in the fan_session cookie map (browser cookie ~4KB limit). */
const MAX_SESSION_CREATORS = 20;

// ─── Password hashing (SHA-256 for mock mode; real production uses bcrypt) ────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ─── Cookie parsing (Model B map + legacy single-token fallback) ─────────────

interface ParsedSessionCookie {
  map: Record<string, string>;
  legacyToken?: string;
}

function parseSessionCookie(raw: string | undefined): ParsedSessionCookie {
  if (!raw) return { map: {} };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { map: parsed as Record<string, string> };
    }
  } catch {
    // Not JSON → legacy single-token cookie (pre-Model B).
  }
  return { map: {}, legacyToken: raw };
}

// ─── Session resolution ───────────────────────────────────────────────────────

async function resolveSessionToken(
  supabase: SupabaseClient,
  token: string,
  creatorId?: string,
): Promise<FanSession | null> {
  const { data } = await supabase
    .from("fan_sessions")
    .select("fan_email, creator_id")
    .eq("token", token)
    .single();

  if (!data) return null;
  const resolvedCreatorId = data.creator_id;
  if (creatorId && resolvedCreatorId !== creatorId) return null;

  const { data: account } = await supabase
    .from("fan_accounts")
    .select("id")
    .eq("email", data.fan_email)
    .eq("creator_id", resolvedCreatorId)
    .single();

  if (!account) return null;

  return {
    email: data.fan_email,
    fanId: account.id,
    creatorId: resolvedCreatorId,
  };
}

/**
 * Resolve the fan session for a creator. Pass `creatorId` when the caller
 * knows which creator's app it's serving; omit it for generic callers that
 * accept any valid session (chat identity, fan dashboard).
 */
export async function getFanSession(
  cookieStore: CookieStoreLike,
  supabase: SupabaseClient,
  creatorId?: string,
): Promise<FanSession | null> {
  const raw = cookieStore.get(FAN_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const { map, legacyToken } = parseSessionCookie(raw);

  if (creatorId) {
    const token = map[creatorId] ?? legacyToken;
    if (!token) return null;
    return resolveSessionToken(supabase, token, creatorId);
  }

  const tokens = legacyToken ? [...Object.values(map), legacyToken] : Object.values(map);
  for (const token of tokens) {
    const session = await resolveSessionToken(supabase, token);
    if (session) return session;
  }
  return null;
}

/**
 * Resolve the fan_accounts id for a creator from the session cookie.
 * Convenience for routes that only need the fan_account id.
 */
export async function getFanAccountForCreator(
  cookieStore: CookieStoreLike,
  supabase: SupabaseClient,
  creatorId: string,
): Promise<string | null> {
  const session = await getFanSession(cookieStore, supabase, creatorId);
  return session?.fanId ?? null;
}

// ─── Session mutation ─────────────────────────────────────────────────────────

import crypto from "crypto";

export interface CookieStoreWritable extends CookieStoreLike {
  get(name: string): { value: string } | undefined;
}

/**
 * Insert a fresh token for (fan, creator), merge it into the per-creator map,
 * and write the cookie. Also prunes any older rows for the same fan+creator so
 * fan_sessions never grows per fan. `cookieStore` carries the incoming cookie
 * so OTHER creators' tokens survive this write.
 */
export async function setFanSession(
  response: NextResponse,
  fanId: string,
  creatorId: string,
  supabase: SupabaseClient,
  cookieStore: CookieStoreLike,
): Promise<void> {
  const { data: account } = await supabase
    .from("fan_accounts")
    .select("email")
    .eq("id", fanId)
    .single();

  if (!account) return;

  const token = crypto.randomUUID();
  await supabase.from("fan_sessions").insert({
    token,
    fan_email: account.email,
    creator_id: creatorId,
    created_at: new Date().toISOString(),
  });

  // Prune stale rows so each fan keeps at most one session row per creator.
  await supabase
    .from("fan_sessions")
    .delete()
    .eq("fan_email", account.email)
    .eq("creator_id", creatorId)
    .neq("token", token);

  const { map } = parseSessionCookie(cookieStore.get(FAN_SESSION_COOKIE)?.value);
  // Re-insert at the end so the most recently used creator is the last evicted.
  delete map[creatorId];
  map[creatorId] = token;
  // Cap the map so a fan who logs into very many creators can't blow the
  // ~4KB browser cookie limit — evict the oldest entries (LRU).
  const keys = Object.keys(map);
  if (keys.length > MAX_SESSION_CREATORS) {
    for (const stale of keys.slice(0, keys.length - MAX_SESSION_CREATORS)) {
      delete map[stale];
    }
  }
  response.cookies.set(FAN_SESSION_COOKIE, JSON.stringify(map), SESSION_OPTIONS);
}

/**
 * Remove ONE creator's token (isolated logout) when `creatorId` + cookieStore
 * are given; otherwise clear the entire fan session. Also drops the matching
 * fan_sessions row so the table stays clean.
 */
export async function clearFanSession(
  response: NextResponse,
  supabase: SupabaseClient,
  creatorId?: string,
  cookieStore?: CookieStoreLike,
): Promise<void> {
  if (creatorId && cookieStore) {
    const { map, legacyToken } = parseSessionCookie(cookieStore.get(FAN_SESSION_COOKIE)?.value);
    const removedToken = map[creatorId] ?? (legacyToken ? legacyToken : null);
    delete map[creatorId];

    if (removedToken) {
      await supabase.from("fan_sessions").delete().eq("token", removedToken);
    } else {
      return;
    }

    const keys = Object.keys(map);
    if (keys.length > 0) {
      response.cookies.set(FAN_SESSION_COOKIE, JSON.stringify(map), SESSION_OPTIONS);
      return;
    }
  }

  response.cookies.set(FAN_SESSION_COOKIE, "", {
    ...SESSION_OPTIONS,
    maxAge: 0,
  });
}