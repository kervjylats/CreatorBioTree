/**
 * PATCH /api/chat/conversations/[id] — group settings (messaging.md Part 4):
 * rename, pin, and the announcements-only ("only I can post") toggle. Owner
 * only; direct conversations can be pinned by either party.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const patchSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  pinned: z.boolean().optional(),
  announcements_only: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

    const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const { data: membership } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", id)
      .eq("participant_key", me.key)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const isOwner = membership.role === "owner";
    if (validation.data.title !== undefined && (!isOwner || convo.type === "direct")) {
      return NextResponse.json({ error: "Only the host can rename this chat" }, { status: 403 });
    }
    if (validation.data.announcements_only !== undefined && (!isOwner || convo.type === "direct")) {
      return NextResponse.json({ error: "Only the host can change posting rules" }, { status: 403 });
    }

    const patch: Record<string, unknown> = { ...validation.data, updated_at: new Date().toISOString() };
    await supabase.from("conversations").update(patch).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/conversations] PATCH:", err);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}