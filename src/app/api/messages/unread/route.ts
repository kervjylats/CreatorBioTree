/**
 * GET /api/messages/unread — total unread badge count for the floating inbox icon
 * (messaging.md Part 1): sum of messages newer than my last_read_at across my
 * visible, unmuted conversations. Polled every 30s by useMessages (mock polling;
 * realtime in production).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Server-side filtered COUNT per conversation (never load full history —
    // this endpoint is polled every 30s by useMessages). Muted conversations are
    // excluded here AND in the per-row counts of /api/messages/conversations, so
    // the icon total and the row pills always agree (2026-10-01 audit).
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("*")
      .eq("participant_key", me.key)
      .is("left_at", null);
    const active = (memberships ?? []).filter((m) => !m.muted_at);
    if (active.length === 0) return NextResponse.json({ unread: 0 });

    let unread = 0;
    await Promise.all(
      active.map(async (member) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", member.conversation_id)
          .neq("sender_key", me.key)
          .is("deleted_at", null)
          .gt("created_at", member.last_read_at ?? "1970-01-01");
        unread += count ?? 0;
      }),
    );

    return NextResponse.json({ unread });
  } catch (err) {
    console.error("[messages/unread] GET:", err);
    return NextResponse.json({ error: "Failed to load unread count" }, { status: 500 });
  }
}