/**
 * GET/POST /api/chat/requests — the Requests folder (messaging.md Part 2
 * privacy): incoming first-contact requests when the recipient has "allow
 * messages from anyone" OFF. GET lists pending requests with sender names;
 * POST approves (creates the direct conversation + delivers the queued first
 * message) or ignores (deletes the request).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity, resolveParticipantNames } from "@/lib/chat";

const actionSchema = z.object({
  request_id: z.string().min(1),
  action: z.enum(["approve", "ignore"]),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: requests } = await supabase
      .from("message_requests")
      .select("*")
      .eq("to_key", me.key)
      .eq("status", "pending");

    const names = await resolveParticipantNames(
      supabase,
      (requests ?? []).map((r) => ({ key: r.from_key as string, party: r.from_party as "creator" | "fan" })),
    );

    return NextResponse.json({
      requests: (requests ?? []).map((r) => ({
        id: r.id,
        from_key: r.from_key,
        from_name: names.get(r.from_key as string) ?? "Unknown",
        body: r.body ?? null,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error("[chat/requests] GET:", err);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = actionSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { data: request } = await supabase.from("message_requests").select("*").eq("id", validation.data.request_id).maybeSingle();
    if (!request || request.to_key !== me.key) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (validation.data.action === "ignore") {
      await supabase.from("message_requests").delete().eq("id", request.id);
      return NextResponse.json({ success: true, status: "ignored" });
    }

    // Approve → open the direct conversation and deliver the queued message.
    const now = new Date().toISOString();
    const { data: convo, error } = await supabase
      .from("conversations")
      .insert({ type: "direct", title: null, creator_id: null, last_message_at: request.body ? now : null, created_at: now, updated_at: now })
      .select("id")
      .single();
    if (error || !convo) return NextResponse.json({ error: "Couldn't open conversation" }, { status: 500 });

    await supabase.from("conversation_members").insert([
      { conversation_id: convo.id, participant_key: me.key, party: me.party, role: "member", added_at: now },
      { conversation_id: convo.id, participant_key: request.from_key, party: request.from_party, role: "member", added_at: now },
    ]);

    if (request.body) {
      await supabase.from("messages").insert({
        conversation_id: convo.id,
        sender_key: request.from_key,
        body: request.body,
        created_at: request.created_at ?? now,
      });
    }

    await supabase.from("message_requests").update({ status: "approved" }).eq("id", request.id);
    return NextResponse.json({ success: true, status: "approved", conversation_id: convo.id });
  } catch (err) {
    console.error("[chat/requests] POST:", err);
    return NextResponse.json({ error: "Failed to handle request" }, { status: 500 });
  }
}