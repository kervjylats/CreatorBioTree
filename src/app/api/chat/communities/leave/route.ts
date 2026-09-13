/**
 * POST /api/chat/communities/leave — fan or member leaves a community,
 * removing themselves from all community channels (messaging.md Part 3).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const leaveSchema = z.object({
  community_id: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = leaveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "community_id required" }, { status: 400 });
    }

    const { data: channels } = await supabase
      .from("conversations")
      .select("id")
      .eq("community_id", validation.data.community_id)
      .eq("type", "community_chat");

    if (!channels?.length) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const channelIds = channels.map((c) => c.id as string);
    const now = new Date().toISOString();

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("id, conversation_id, role")
      .eq("participant_key", me.key)
      .in("conversation_id", channelIds);

    for (const m of memberships ?? []) {
      if (m.role === "owner") {
        return NextResponse.json({ error: "Community creators cannot leave their own community" }, { status: 400 });
      }
      await supabase
        .from("conversation_members")
        .update({ left_at: now })
        .eq("id", m.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/communities/leave] POST:", err);
    return NextResponse.json({ error: "Failed to leave community" }, { status: 500 });
  }
}
