/**
 * GET/POST /api/chat/conversations/[id]/messages — thread history (ascending,
 * with attachments + member names) and sending a message (messaging.md Part
 * 2/4). Send checks membership, the group announcements-only rule (owner-only
 * posting) and updates last_message_at. The allow-anyone gate runs at
 * conversation creation, so sending here means the conversation exists.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity, isBlocked, resolveParticipantNames } from "@/lib/chat";

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
  attachment: z
    .object({
      url: z.string().max(2000),
      name: z.string().max(255),
      mime: z.string().max(100),
      size: z.number().int().min(0).optional(),
    })
    .nullable()
    .optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await getMembership(supabase, id, me.key);
    if (!membership) return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 });

    const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const { data: memberRows } = await supabase.from("conversation_members").select("*").eq("conversation_id", id);
    const { data: messageRows } = await supabase.from("messages").select("*").eq("conversation_id", id);
    const messageIds = (messageRows ?? []).map((m) => m.id as string);
    const { data: attachmentRows } = messageIds.length
      ? await supabase.from("message_attachments").select("*").in("message_id", messageIds)
      : { data: [] };

    const names = await resolveParticipantNames(
      supabase,
      (memberRows ?? []).map((m) => ({ key: m.participant_key as string, party: m.party as "creator" | "fan" })),
    );

    const messages = (messageRows ?? [])
      .slice()
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((m) => ({
        id: m.id,
        sender_key: m.sender_key,
        sender_name: names.get(m.sender_key as string) ?? "Unknown",
        body: m.body,
        created_at: m.created_at,
        edited_at: m.edited_at ?? null,
        deleted_at: m.deleted_at ?? null,
        attachments: (attachmentRows ?? []).filter((a) => a.message_id === m.id).map((a) => ({
          url: a.storage_url,
          name: a.name,
          mime: a.mime,
          size: a.size ?? 0,
        })),
      }));

    return NextResponse.json({
      myKey: me.key,
      myRole: membership.role ?? "member",
      conversation: {
        id: convo.id,
        type: convo.type,
        title: convo.title,
        pinned: Boolean(convo.pinned),
        announcementsOnly: Boolean(convo.announcements_only),
        muted: Boolean(membership.muted_at),
      },
      members: (memberRows ?? []).map((m) => ({
        key: m.participant_key,
        party: m.party,
        role: m.role ?? "member",
        name: names.get(m.participant_key as string) ?? "Unknown",
        left: Boolean(m.left_at),
      })),
      messages,
    });
  } catch (err) {
    console.error("[chat/messages] GET:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = sendSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Message body required" }, { status: 400 });
    const { body: text, attachment } = validation.data;

    const membership = await getMembership(supabase, id, me.key);
    if (!membership || membership.left_at) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 });
    }

    const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Announcements mode — only the owner posts (Part 4).
    if (convo.type !== "direct" && convo.announcements_only && membership.role !== "owner") {
      return NextResponse.json({ error: "Only the host can post in this chat" }, { status: 403 });
    }

    if (convo.type === "direct") {
      const { data: otherMember } = await supabase
        .from("conversation_members")
        .select("participant_key")
        .eq("conversation_id", id)
        .neq("participant_key", me.key)
        .maybeSingle();
      // Both directions — a blocked user must not message me, and I must not
      // message someone who blocked me (Part 2 block).
      if (
        otherMember &&
        ((await isBlocked(supabase, me.key, otherMember.participant_key as string)) ||
          (await isBlocked(supabase, otherMember.participant_key as string, me.key)))
      ) {
        return NextResponse.json({ error: "You can't message this person" }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    const { data: message, error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_key: me.key, body: text, created_at: now })
      .select("id")
      .single();
    if (error || !message) return NextResponse.json({ error: "Couldn't send message" }, { status: 500 });

    if (attachment) {
      await supabase.from("message_attachments").insert({
        message_id: message.id,
        storage_url: attachment.url,
        mime: attachment.mime,
        name: attachment.name,
        size: attachment.size ?? 0,
      });
    }

    await supabase.from("conversations").update({ last_message_at: now, updated_at: now }).eq("id", id);

    return NextResponse.json(
      {
        id: message.id,
        sender_key: me.key,
        sender_name: me.displayName,
        body: text,
        created_at: now,
        edited_at: null,
        deleted_at: null,
        attachments: attachment ? [{ ...attachment }] : [],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[chat/messages] POST:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string, key: string) {
  const { data } = await supabase
    .from("conversation_members")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("participant_key", key)
    .maybeSingle();
  return data ?? null;
}