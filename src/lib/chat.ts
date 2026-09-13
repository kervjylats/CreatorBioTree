/**
 * chat.ts — server-side chat helpers (messaging.md Parts 1/2/4/5): party
 * identity resolution (creator via creator auth, fan via fan_session cookie),
 * display-name resolution, block checks, allow-anyone preference gate and the
 * direct-conversation find-or-create. Shared by every /api/chat/* route —
 * the client never knows its own key; routes return `myKey` alongside data.
 */
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFanSession } from "@/lib/fanSession";

/** A chat participant — fan side uses fan_accounts.id, creator side uses creators.id (messaging.md Part 5). */
export interface ChatParticipant {
  key: string;
  party: "creator" | "fan";
}

export interface ChatIdentity extends ChatParticipant {
  displayName: string;
}

/** Resolve the caller: creator auth first, then fan_session (messaging.md Part 7 auth note). */
export async function getChatIdentity(supabase: SupabaseClient): Promise<ChatIdentity | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    const { data: creator } = await supabase
      .from("creators")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();
    return {
      key: user.id,
      party: "creator",
      displayName: creator?.display_name || user.email || "Creator",
    };
  }

  const session = await getFanSession(await cookies(), supabase);
  if (session) {
    const { data: account } = await supabase
      .from("fan_accounts")
      .select("id, email")
      .eq("id", session.fanId)
      .maybeSingle();
    if (account) return { key: account.id, party: "fan", displayName: account.email };
  }
  return null;
}

/** Display names for arbitrary participants (creator = display_name, fan = email). */
export async function resolveParticipantNames(
  supabase: SupabaseClient,
  participants: ChatParticipant[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const creators = participants.filter((p) => p.party === "creator");
  const fans = participants.filter((p) => p.party === "fan");

  if (creators.length) {
    const { data } = await supabase
      .from("creators")
      .select("id, display_name")
      .in(
        "id",
        creators.map((c) => c.key),
      );
    for (const row of data ?? []) map.set(row.id, row.display_name || row.id);
  }
  if (fans.length) {
    const { data } = await supabase
      .from("fan_accounts")
      .select("id, email")
      .in(
        "id",
        fans.map((f) => f.key),
      );
    for (const row of data ?? []) map.set(row.id, row.email);
  }
  return map;
}

/** Either direction blocked? (blocked_users rows are stored as blocker → blocked). */
export async function isBlocked(supabase: SupabaseClient, a: string, b: string): Promise<boolean> {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocker_key")
    .eq("blocker_key", a)
    .eq("blocked_key", b)
    .maybeSingle();
  return Boolean(data);
}

/** Per-party chat prefs — default: allow messages from anyone (messaging.md Part 2 privacy). */
export async function getPrefs(
  supabase: SupabaseClient,
  key: string,
): Promise<{ allow_messages_from_anyone: boolean }> {
  const { data } = await supabase
    .from("chat_prefs")
    .select("allow_messages_from_anyone")
    .eq("participant_key", key)
    .maybeSingle();
  return { allow_messages_from_anyone: data?.allow_messages_from_anyone ?? true };
}

/** Set per-party chat prefs (insert or update by participant_key). */
export async function setPrefs(
  supabase: SupabaseClient,
  key: string,
  prefs: { allow_messages_from_anyone: boolean },
): Promise<void> {
  const { data: existing } = await supabase
    .from("chat_prefs")
    .select("participant_key")
    .eq("participant_key", key)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("chat_prefs")
      .update({ allow_messages_from_anyone: prefs.allow_messages_from_anyone })
      .eq("participant_key", key);
  } else {
    // NOTE: existence must be checked against the raw row, NOT getPrefs() —
    // the getPrefs default (allow=true) made a missing row look "existing",
    // so the update path ran against zero rows and silently dropped writes
    // (2026-08-13: PATCH preferences returned 200 but never persisted).
    await supabase.from("chat_prefs").insert({
      participant_key: key,
      allow_messages_from_anyone: prefs.allow_messages_from_anyone,
    });
  }
}
