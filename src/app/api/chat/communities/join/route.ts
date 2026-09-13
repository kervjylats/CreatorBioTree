/**
 * POST /api/chat/communities/join — fan joins a community. Checks join_rule
 * (open / fans_partners / invite_only) per messaging.md Part 3 decision #8.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const joinSchema = z.object({
  community_id: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = joinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "community_id required" }, { status: 400 });
    }

    const { data: community } = await supabase
      .from("communities")
      .select("*")
      .eq("id", validation.data.community_id)
      .maybeSingle();

    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

    if (community.join_rule === "invite_only" && me.party === "fan") {
      return NextResponse.json({ error: "This community is invite-only" }, { status: 403 });
    }

    if (community.join_rule === "fans_partners" && me.party === "fan") {
      const { data: fanAccount } = await supabase
        .from("fan_accounts")
        .select("id")
        .eq("id", me.key)
        .eq("creator_id", community.creator_id)
        .maybeSingle();
      if (!fanAccount) {
        return NextResponse.json({ error: "You must follow this creator to join" }, { status: 403 });
      }
    }

    const { data: channels } = await supabase
      .from("conversations")
      .select("id")
      .eq("community_id", community.id)
      .eq("type", "community_chat");

    if (!channels?.length) {
      return NextResponse.json({ error: "Community has no channels" }, { status: 500 });
    }

    const now = new Date().toISOString();
    const memberRows = channels.map((ch) => ({
      conversation_id: ch.id,
      participant_key: me.key,
      party: me.party,
      role: "member",
      added_at: now,
    }));

    const { error } = await supabase.from("conversation_members").insert(memberRows);
    if (error) return NextResponse.json({ error: "Failed to join" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/communities/join] POST:", err);
    return NextResponse.json({ error: "Failed to join community" }, { status: 500 });
  }
}
