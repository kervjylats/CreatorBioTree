/**
 * GET/POST /api/chat/conversations — list my conversations (newest activity
 * first, with unread counts, per messaging.md Part 1) and find-or-create a
 * direct conversation (WhatsApp pattern, Part 2) or create a group (Part 4,
 * creators only). The allow-anyone gate (Part 2 privacy) intercepts first
 * contact with a stranger and returns { status: "requested" } — the request
 * lands in the recipient's Requests folder.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity, isBlocked, resolveParticipantNames } from "@/lib/chat";
import { getPrefs } from "@/lib/chat";

interface ConvoRow {
  id: string;
  type: string;
  title: string | null;
  creator_id: string | null;
  pinned: boolean | null;
  announcements_only: boolean | null;
  last_message_at: string | null;
  created_at: string;
}

async function listConversations(supabase: Awaited<ReturnType<typeof createClient>>, meKey: string) {
  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("*")
    .eq("participant_key", meKey);

  const active = (memberships ?? []).filter((m) => !m.left_at);
  if (active.length === 0) return [];

  const convoIds = active.map((m) => m.conversation_id as string);
  const { data: convos } = await supabase.from("conversations").select("*").in("id", convoIds);

  const { data: allMembers } = await supabase
    .from("conversation_members")
    .select("*")
    .in("conversation_id", convoIds);
  const { data: allMessages } = await supabase.from("messages").select("*").in("conversation_id", convoIds);

  const nameParticipants = (allMembers ?? []).map((m) => ({ key: m.participant_key as string, party: m.party as "creator" | "fan" }));
  const names = await resolveParticipantNames(supabase, nameParticipants);

  const summaries = [];
  for (const convo of (convos ?? []) as ConvoRow[]) {
    const memberRow = active.find((m) => m.conversation_id === convo.id)!;
    const msgs = (allMessages ?? []).filter((m) => m.conversation_id === convo.id && !m.deleted_at);
    msgs.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const last = msgs.length ? msgs[msgs.length - 1] : null;
    const unread = msgs.filter(
      (m) => m.sender_key !== meKey && String(m.created_at) > (memberRow.last_read_at ?? "1970-01-01"),
    ).length;

    let title = convo.title ?? "Direct message";
    let otherKey: string | null = null;
    let otherParty: "creator" | "fan" | null = null;
    if (convo.type === "direct") {
      const other = (allMembers ?? []).find((m) => m.conversation_id === convo.id && m.participant_key !== meKey);
      otherKey = other?.participant_key ?? null;
      otherParty = other?.party ?? null;
      if (other) title = names.get(other.participant_key as string) ?? "Direct message";
    }

    summaries.push({
      id: convo.id,
      type: convo.type,
      title,
      otherKey,
      otherParty,
      lastMessage: last
        ? { body: last.body as string, created_at: last.created_at as string, deleted: Boolean(last.deleted_at), sender_key: last.sender_key }
        : null,
      unread,
      muted: Boolean(memberRow.muted_at),
      pinned: Boolean(convo.pinned),
      announcementsOnly: Boolean(convo.announcements_only),
      myRole: memberRow.role ?? "member",
      memberCount: (allMembers ?? []).filter((m) => m.conversation_id === convo.id && !m.left_at).length,
      updatedAt: convo.last_message_at ?? convo.created_at,
    });
  }
  summaries.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return summaries;
}

const createSchema = z.object({
  type: z.enum(["direct", "group"]),
  other_key: z.string().min(1).max(100).optional(),
  other_party: z.enum(["creator", "fan"]).optional(),
  first_message: z.string().max(2000).optional(),
  title: z.string().min(1).max(80).optional(),
  members: z
    .array(z.object({ key: z.string().min(1).max(100), party: z.enum(["creator", "fan"]) }))
    .max(200)
    .optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await listConversations(supabase, me.key);
    return NextResponse.json({ myKey: me.key, myParty: me.party, conversations });
  } catch (err) {
    console.error("[chat/conversations] GET:", err);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const { type, other_key, other_party, first_message, title, members } = validation.data;

    if (type === "direct") {
      if (!other_key || !other_party) return NextResponse.json({ error: "Missing conversation target" }, { status: 400 });
      if (other_key === me.key) return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });

      if (await isBlocked(supabase, other_key, me.key)) {
        return NextResponse.json({ error: "You can't message this person" }, { status: 403 });
      }
      if (await isBlocked(supabase, me.key, other_key)) {
        return NextResponse.json({ error: "You can't message this person" }, { status: 403 });
      }

      // WhatsApp find-or-create — reuse an existing direct conversation.
      const existing = await findDirect(supabase, me.key, other_key);
      if (existing) {
        if (first_message) {
          await insertMessage(supabase, existing.id, me.key, first_message);
        }
        return NextResponse.json({ conversation_id: existing.id, status: "ok" });
      }

      // Allow-anyone gate (Part 2 privacy): a stranger's first message becomes a request.
      // Applies to BOTH creators AND fans as recipients (messaging.md Part 2 privacy).
      const prefs = await getPrefs(supabase, other_key);
      const isKnown = await isKnownContact(supabase, me, other_key, other_party);
      if (!prefs.allow_messages_from_anyone && !isKnown) {
        const { data: request } = await supabase
          .from("message_requests")
          .insert({
            from_key: me.key,
            from_party: me.party,
            to_key: other_key,
            to_party: other_party,
            status: "pending",
            body: first_message ?? null,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        return NextResponse.json({ status: "requested", request_id: request?.id }, { status: 201 });
      }

      const now = new Date().toISOString();
      const { data: convo, error } = await supabase
        .from("conversations")
        .insert({ type: "direct", title: null, creator_id: null, last_message_at: first_message ? now : null, created_at: now, updated_at: now })
        .select("id")
        .single();
      if (error || !convo) return NextResponse.json({ error: "Couldn't start conversation" }, { status: 500 });

      await supabase.from("conversation_members").insert([
        { conversation_id: convo.id, participant_key: me.key, party: me.party, role: "member", last_read_at: first_message ? now : null, added_at: now },
        { conversation_id: convo.id, participant_key: other_key, party: other_party, role: "member", added_at: now },
      ]);
      if (first_message) await insertMessage(supabase, convo.id, me.key, first_message);

      return NextResponse.json({ conversation_id: convo.id, status: "ok" }, { status: 201 });
    }

    // Groups — creators only (Part 4).
    if (me.party !== "creator") return NextResponse.json({ error: "Only creators can create group chats" }, { status: 403 });
    if (!title) return NextResponse.json({ error: "Group name required" }, { status: 400 });

    const now = new Date().toISOString();
    const { data: group, error } = await supabase
      .from("conversations")
      .insert({ type: "group", title, creator_id: me.key, last_message_at: null, created_at: now, updated_at: now })
      .select("id")
      .single();
    if (error || !group) return NextResponse.json({ error: "Couldn't create group" }, { status: 500 });

    const memberRows = [
      { conversation_id: group.id, participant_key: me.key, party: me.party, role: "owner", added_at: now },
      ...(members ?? []).map((m) => ({
        conversation_id: group.id,
        participant_key: m.key,
        party: m.party,
        role: "member",
        added_at: now,
      })),
    ];
    await supabase.from("conversation_members").insert(memberRows);

    return NextResponse.json({ conversation_id: group.id, status: "ok" }, { status: 201 });
  } catch (err) {
    console.error("[chat/conversations] POST:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

async function findDirect(supabase: Awaited<ReturnType<typeof createClient>>, a: string, b: string) {
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("participant_key", a)
    .eq("left_at", null);
  if (!mine?.length) return null;
  const ids = mine.map((m) => m.conversation_id as string);
  const { data: theirs } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("participant_key", b)
    .in("conversation_id", ids);
  if (!theirs?.length) return null;
  const { data: convos } = await supabase.from("conversations").select("id, type").in(
    "id",
    theirs.map((t) => t.conversation_id as string),
  );
  return (convos ?? []).find((c) => c.type === "direct") ?? null;
}

async function insertMessage(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string, senderKey: string, body: string) {
  const now = new Date().toISOString();
  const { data: message } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_key: senderKey, body, created_at: now })
    .select("id")
    .single();
  await supabase.from("conversations").update({ last_message_at: now, updated_at: now }).eq("id", conversationId);
  return message;
}

async function isKnownContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  me: { key: string; party: string },
  otherKey: string,
  otherParty: string,
): Promise<boolean> {
  // Known contact = we have an existing conversation OR the other party follows/is fan of us.
  // Check existing conversation first (cheapest path).
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("participant_key", me.key);
  if (mine?.length) {
    const ids = mine.map((m) => m.conversation_id as string);
    const { data: theirs } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("participant_key", otherKey)
      .in("conversation_id", ids);
    if (theirs?.length) return true;
  }
  // Fan→creator: check if fan is a follower of the creator.
  if (me.party === "fan" && otherParty === "creator") {
    const { data } = await supabase
      .from("fan_accounts")
      .select("id")
      .eq("id", me.key)
      .eq("creator_id", otherKey)
      .maybeSingle();
    return Boolean(data);
  }
  return false;
}