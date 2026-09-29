/**
 * PATCH/DELETE /api/messages/[id] — edit your own message (sets
 * edited_at) and delete with a tombstone (WhatsApp-style, messaging.md Part
 * 2). Group owners may delete any message in their conversation (Part 4 moderation).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";

const editSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = editSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Message body required" }, { status: 400 });

    const { data: message } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
    if (!message || message.deleted_at) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.sender_key !== me.key) return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });

    await supabase.from("messages").update({ body: validation.data.body, edited_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[messages/messages] PATCH:", err);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: message } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
    if (!message || message.deleted_at) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", message.conversation_id)
      .eq("participant_key", me.key)
      .maybeSingle();

    const isOwner = membership?.role === "owner";
    if (message.sender_key !== me.key && !isOwner) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[messages/messages] DELETE:", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}