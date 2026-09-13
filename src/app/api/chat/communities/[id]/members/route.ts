/**
 * POST /api/chat/communities/[id]/members — creator adds a member with a
 * role (Member / VIP / Partner) to all community channels (messaging.md
 * Part 3 decision #7 — creator-only moderation).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const addMemberSchema = z.object({
  key: z.string().min(1),
  party: z.enum(["creator", "fan"]),
  role: z.enum(["member", "vip", "partner"]).default("member"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can add members" }, { status: 403 });
    }

    const { data: community } = await supabase
      .from("communities")
      .select("id, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    if (community.creator_id !== me.key) {
      return NextResponse.json({ error: "Only the community owner can add members" }, { status: 403 });
    }

    const body = await req.json();
    const validation = addMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid member data" }, { status: 400 });
    }

    const { data: channels } = await supabase
      .from("conversations")
      .select("id")
      .eq("community_id", id)
      .eq("type", "community_chat");

    const channelIds = (channels ?? []).map((c) => c.id as string);
    if (channelIds.length === 0) {
      return NextResponse.json({ error: "Community has no channels" }, { status: 500 });
    }

    const now = new Date().toISOString();
    const memberRows = channelIds.map((cid) => ({
      conversation_id: cid,
      participant_key: validation.data.key,
      party: validation.data.party,
      role: validation.data.role,
      added_at: now,
    }));

    await supabase.from("conversation_members").insert(memberRows);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[chat/communities/members] POST:", err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
