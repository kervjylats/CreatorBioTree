/**
 * GET /api/chat/unread — total unread badge count for the floating inbox icon
 * (messaging.md Part 1): sum of messages newer than my last_read_at across my
 * visible conversations. Polled by useUnreadBadge (mock) / realtime (prod).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("*")
      .eq("participant_key", me.key);
    const active = (memberships ?? []).filter((m) => !m.left_at && !m.muted_at);
    if (active.length === 0) return NextResponse.json({ unread: 0 });

    const convoIds = active.map((m) => m.conversation_id as string);
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, sender_key, created_at, deleted_at")
      .in("conversation_id", convoIds);

    let unread = 0;
    for (const m of messages ?? []) {
      if (m.deleted_at || m.sender_key === me.key) continue;
      const member = active.find((a) => a.conversation_id === m.conversation_id);
      if (member && String(m.created_at) > (member.last_read_at ?? "1970-01-01")) unread += 1;
    }

    return NextResponse.json({ unread });
  } catch (err) {
    console.error("[chat/unread] GET:", err);
    return NextResponse.json({ error: "Failed to load unread count" }, { status: 500 });
  }
}