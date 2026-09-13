/**
 * GET /api/chat/communities/[id]/channels — list channels in a community
 * with access check (messaging.md Part 3 decisions #5 + #6). Restricted
 * channels only visible to members with the right role.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: community } = await supabase
      .from("communities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

    const isOwner = community.creator_id === me.key;

    const { data: channels } = await supabase
      .from("conversations")
      .select("*")
      .eq("community_id", id)
      .eq("type", "community_chat");

    const channelIds = (channels ?? []).map((c) => c.id as string);
    const myMemberships: Record<string, string> = {};
    if (channelIds.length > 0) {
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id, role")
        .eq("participant_key", me.key)
        .in("conversation_id", channelIds);
      for (const m of memberships ?? []) {
        myMemberships[m.conversation_id as string] = m.role as string;
      }
    }

    const visible = (channels ?? []).filter((ch) => {
      if (isOwner) return true;
      if (!ch.restricted) return true;
      return myMemberships[ch.id as string] !== undefined;
    });

    const enriched = visible.map((ch) => ({
      ...ch,
      myRole: myMemberships[ch.id as string] ?? null,
      memberCount: 0,
    }));

    return NextResponse.json({ channels: enriched });
  } catch (err) {
    console.error("[chat/communities/channels] GET:", err);
    return NextResponse.json({ error: "Failed to load channels" }, { status: 500 });
  }
}
