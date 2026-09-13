/**
 * DELETE /api/chat/communities/[id]/members/[key] — creator removes a member
 * from all community channels (messaging.md Part 3 decision #7).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; key: string }> },
) {
  try {
    const { id, key } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can remove members" }, { status: 403 });
    }

    const { data: community } = await supabase
      .from("communities")
      .select("id, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    if (community.creator_id !== me.key) {
      return NextResponse.json({ error: "Only the community owner can remove members" }, { status: 403 });
    }

    if (key === me.key) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    const { data: channels } = await supabase
      .from("conversations")
      .select("id")
      .eq("community_id", id)
      .eq("type", "community_chat");

    const channelIds = (channels ?? []).map((c) => c.id as string);
    const now = new Date().toISOString();

    for (const cid of channelIds) {
      await supabase
        .from("conversation_members")
        .update({ left_at: now })
        .eq("conversation_id", cid)
        .eq("participant_key", key);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/communities/members] DELETE:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
