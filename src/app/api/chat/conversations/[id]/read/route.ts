/**
 * POST /api/chat/conversations/[id]/read — mark a conversation read by
 * setting my last_read_at (messaging.md Part 2 read state). Unread counts
 * derive from last_read_at, so this clears the badge.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("conversation_members")
      .update({ last_read_at: now })
      .eq("conversation_id", id)
      .eq("participant_key", me.key);

    if (error) return NextResponse.json({ error: "Couldn't mark as read" }, { status: 500 });
    return NextResponse.json({ success: true, read_at: now });
  } catch (err) {
    console.error("[chat/read] POST:", err);
    return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
  }
}