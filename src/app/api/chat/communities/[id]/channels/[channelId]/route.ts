/**
 * PATCH /api/chat/communities/[id]/channels/[channelId] — creator renames
 * a channel, toggles announcements-only, or toggles restricted access
 * (messaging.md Part 3 decisions #5 + #6 + #7).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const patchSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  announcements_only: z.boolean().optional(),
  restricted: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; channelId: string }> },
) {
  try {
    const { id, channelId } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can manage channels" }, { status: 403 });
    }

    const { data: community } = await supabase
      .from("communities")
      .select("id, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    if (community.creator_id !== me.key) {
      return NextResponse.json({ error: "Only the community owner can manage channels" }, { status: 403 });
    }

    const body = await req.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const { data: channel } = await supabase
      .from("conversations")
      .select("id, community_id")
      .eq("id", channelId)
      .eq("community_id", id)
      .maybeSingle();

    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const patch: Record<string, unknown> = { ...validation.data, updated_at: new Date().toISOString() };
    await supabase.from("conversations").update(patch).eq("id", channelId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/communities/channels] PATCH:", err);
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}
