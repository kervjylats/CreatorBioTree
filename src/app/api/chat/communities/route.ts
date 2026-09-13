/**
 * GET/POST /api/chat/communities — get the creator's community or the fan's
 * joined community (GET), and create a new community with 4 default channels
 * (POST, creator only, one per creator — messaging.md Part 3).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(10).optional(),
  join_rule: z.enum(["open", "fans_partners", "invite_only"]).default("open"),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (me.party === "creator") {
      const { data: community } = await supabase
        .from("communities")
        .select("*")
        .eq("creator_id", me.key)
        .maybeSingle();
      return NextResponse.json({ community: community ?? null });
    }

    const { data: membership } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("participant_key", me.key);
    if (!membership?.length) return NextResponse.json({ community: null });

    const convoIds = membership.map((m) => m.conversation_id as string);
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, creator_id")
      .in("id", convoIds)
      .eq("type", "community_chat");

    const ownerIds = [...new Set((convos ?? []).map((c) => c.creator_id as string).filter(Boolean))];
    if (ownerIds.length === 0) return NextResponse.json({ community: null });

    const { data: communities } = await supabase
      .from("communities")
      .select("*")
      .in("creator_id", ownerIds);

    return NextResponse.json({ community: communities?.[0] ?? null });
  } catch (err) {
    console.error("[chat/communities] GET:", err);
    return NextResponse.json({ error: "Failed to load community" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can create communities" }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("communities")
      .select("id")
      .eq("creator_id", me.key)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "You already have a community" }, { status: 409 });
    }

    const body = await req.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid community data" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        creator_id: me.key,
        name: validation.data.name,
        icon: validation.data.icon ?? null,
        join_rule: validation.data.join_rule,
        created_at: now,
      })
      .select("id")
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
    }

    const defaultChannels = [
      { title: "General", announcements_only: false, restricted: false },
      { title: "Announcements", announcements_only: true, restricted: false },
      { title: "VIPs", announcements_only: false, restricted: true },
      { title: "Partner collab", announcements_only: false, restricted: true },
    ];

    const channelRows = defaultChannels.map((ch) => ({
      type: "community_chat",
      title: ch.title,
      creator_id: me.key,
      community_id: community.id,
      announcements_only: ch.announcements_only,
      restricted: ch.restricted,
      last_message_at: null,
      created_at: now,
      updated_at: now,
    }));

    const { data: channels } = await supabase.from("conversations").insert(channelRows).select("id, title");

    const channelIds = (channels ?? []).map((c) => c.id as string);
    const memberRows = channelIds.map((cid) => ({
      conversation_id: cid,
      participant_key: me.key,
      party: "creator",
      role: "owner",
      added_at: now,
    }));
    if (memberRows.length > 0) {
      await supabase.from("conversation_members").insert(memberRows);
    }

    return NextResponse.json({ community, channels: channels ?? [] }, { status: 201 });
  } catch (err) {
    console.error("[chat/communities] POST:", err);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
