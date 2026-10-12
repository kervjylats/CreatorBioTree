/**
 * partnerInvites.ts — shared invite-consumption logic for the partnership
 * invite code (partnership.md Part 2 + "THE private-collab path", 2026-10-07).
 * Used by BOTH POST /api/creator/partners/onboarding (post-signup + API callers)
 * and the /onboarding Screen's logged-in accept path — one implementation, no
 * duplicated validate/mark-used/connect sequence.
 */
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface ConsumeInviteSuccess {
  ok: true;
  partner: { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
}

export interface ConsumeInviteFailure {
  ok: false;
  error: string;
  status: number;
}

export type ConsumeInviteResult = ConsumeInviteSuccess | ConsumeInviteFailure;

/**
 * Validate a partner invite code for `userId`, mark it used, and create the
 * `partnerships` row (source "invited") when not already connected. Idempotent
 * toward existing active connections. Pure logic — callers decide redirects.
 */
export async function consumePartnerInvite(
  supabase: SupabaseServer,
  userId: string,
  code: string
): Promise<ConsumeInviteResult> {
  const { data: invite } = await supabase
    .from("partner_invites")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();

  if (!invite) {
    return { ok: false, error: "Invite invalid or expired", status: 404 };
  }
  if (invite.used_by) {
    return { ok: false, error: "Invite already used", status: 409 };
  }
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: "Invite invalid or expired", status: 410 };
  }
  if (invite.from_creator_id === userId) {
    return { ok: false, error: "Cannot accept your own invite", status: 400 };
  }

  await supabase
    .from("partner_invites")
    .update({ used_by: userId })
    .eq("id", invite.id);

  const { data: alreadyConnected } = await supabase
    .from("partnerships")
    .select("id")
    .eq("status", "active")
    .or(`and(creator_a.eq.${invite.from_creator_id},creator_b.eq.${userId}),and(creator_a.eq.${userId},creator_b.eq.${invite.from_creator_id})`)
    .maybeSingle();

  if (!alreadyConnected) {
    const now = new Date().toISOString();
    await supabase.from("partnerships").insert({
      creator_a: invite.from_creator_id,
      creator_b: userId,
      status: "active",
      source: "invited",
      commission_pct: 0,
      notes: null,
      created_at: now,
      updated_at: now,
    });
  }

  const { data: partner } = await supabase
    .from("creators")
    .select("id, username, display_name, avatar_url")
    .eq("id", invite.from_creator_id)
    .maybeSingle();

  return {
    ok: true,
    partner: partner ?? { id: invite.from_creator_id, username: null, display_name: null, avatar_url: null },
  };
}
