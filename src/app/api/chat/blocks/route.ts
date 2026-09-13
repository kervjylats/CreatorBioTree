/**
 * GET /api/chat/blocks — the visible block list (messaging.md Part 2): who I
 * blocked, with display names. No unblock route in v1 mock — deleting the
 * blocked_users row is the production path; the list itself is read-only here.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity, resolveParticipantNames } from "@/lib/chat";

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: blocks } = await supabase
      .from("blocked_users")
      .select("*")
      .eq("blocker_key", me.key);

    const names = await resolveParticipantNames(
      supabase,
      (blocks ?? []).map((b) => ({
        key: b.blocked_key as string,
        // Derive blocked party from caller identity: if I'm a creator, I blocked a fan and vice versa.
        party: (me.party === "creator" ? "fan" : "creator") as "creator" | "fan",
      })),
    );

    return NextResponse.json({
      blocks: (blocks ?? []).map((b) => ({
        key: b.blocked_key,
        name: names.get(b.blocked_key as string) ?? "Unknown",
        created_at: b.created_at,
      })),
    });
  } catch (err) {
    console.error("[chat/blocks] GET:", err);
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }
}