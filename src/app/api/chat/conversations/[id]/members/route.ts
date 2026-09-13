/**
 * POST/DELETE /api/chat/conversations/[id]/members — group membership
 * management (messaging.md Part 4): the owner adds members; DELETE (with a
 * body { member_key }) removes a member or lets anyone leave their own chat.
 * Direct conversations have no member management.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const addSchema = z.object({
  member_key: z.string().min(1).max(100),
  member_party: z.enum(["creator", "fan"]),
});

const removeSchema = z.object({
  member_key: z.string().min(1).max(100),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = addSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Missing member" }, { status: 400 });

    const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    if (!convo || convo.type === "direct") return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", id)
      .eq("participant_key", me.key)
      .maybeSingle();
    if (membership?.role !== "owner") return NextResponse.json({ error: "Only the host can add members" }, { status: 403 });

    const now = new Date().toISOString();
    await supabase.from("conversation_members").upsert(
      {
        conversation_id: id,
        participant_key: validation.data.member_key,
        party: validation.data.member_party,
        role: "member",
        added_at: now,
        left_at: null,
      },
      { onConflict: "conversation_id,participant_key" },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/members] POST:", err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const validation = removeSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Missing member" }, { status: 400 });
    const target = validation.data.member_key;

    const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    if (!convo || convo.type === "direct") return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", id)
      .eq("participant_key", me.key)
      .maybeSingle();

    // Leave yourself, or remove others as owner.
    if (target !== me.key && membership?.role !== "owner") {
      return NextResponse.json({ error: "Only the host can remove members" }, { status: 403 });
    }

    await supabase
      .from("conversation_members")
      .update({ left_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .eq("participant_key", target);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/members] DELETE:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}