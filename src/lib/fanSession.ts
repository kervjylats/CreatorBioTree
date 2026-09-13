/** Central fan session management — per-creator identity model. */
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CookieStoreLike {
  get(name: string): { value: string } | undefined;
}

export interface FanSession {
  email:     string;
  fanId:     string;
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

// ─── Session resolution ───────────────────────────────────────────────────────

export async function getFanSession(
  cookieStore: CookieStoreLike,
  supabase: SupabaseClient,
): Promise<FanSession | null> {
  const token = cookieStore.get("fan_session")?.value;
  if (!token) return null;

  const { data, error } = await supabase
    .from("fan_sessions")
    .select("fan_email, creator_id")
    .eq("token", token)
    .single();

  if (error || !data) return null;

  const { data: account } = await supabase
    .from("fan_accounts")
    .select("id")
    .eq("email", data.fan_email)
    .eq("creator_id", data.creator_id)
    .single();

  if (!account) return null;

  return {
    email: data.fan_email,
    fanId: account.id,
    creatorId: data.creator_id,
  };
}

/**
 * Backward-compat: resolves fan_account id for a creator from the session
 * cookie. Used by routes that only need the fan_account id.
 */
export async function getFanAccountForCreator(
  cookieStore: CookieStoreLike,
  supabase: SupabaseClient,
  creatorId: string,
): Promise<string | null> {
  const token = cookieStore.get("fan_session")?.value;
  if (!token) return null;

  const { data: sessionData } = await supabase
    .from("fan_sessions")
    .select("fan_email, creator_id")
    .eq("token", token)
    .single();

  if (!sessionData) return null;
  if (sessionData.creator_id !== creatorId) return null;

  const { data: account } = await supabase
    .from("fan_accounts")
    .select("id")
    .eq("email", sessionData.fan_email)
    .eq("creator_id", creatorId)
    .single();

  return account?.id ?? null;
}

// ─── Session mutation ─────────────────────────────────────────────────────────

import crypto from "crypto";

export async function setFanSession(
  response: NextResponse,
  fanId: string,
  creatorId: string,
  supabase: SupabaseClient,
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
  response.cookies.set("fan_session", token, SESSION_OPTIONS);
}

export function clearFanSession(response: NextResponse): void {
  response.cookies.set("fan_session", "", {
    ...SESSION_OPTIONS,
    maxAge: 0,
  });
}
