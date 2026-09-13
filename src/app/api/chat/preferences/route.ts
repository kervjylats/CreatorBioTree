/**
 * PATCH /api/chat/preferences — per-party messaging privacy (messaging.md
 * Part 2): the "Allow messages from anyone" toggle. Stored in chat_prefs
 * keyed by participant_key; when OFF, strangers' first messages land in the
 * Requests folder instead of a conversation.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity, getPrefs, setPrefs } from "@/lib/chat";

const prefsSchema = z.object({
  allow_messages_from_anyone: z.boolean(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(await getPrefs(supabase, me.key));
  } catch (err) {
    console.error("[chat/preferences] GET:", err);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = prefsSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });

    await setPrefs(supabase, me.key, validation.data);
    return NextResponse.json({ success: true, ...validation.data });
  } catch (err) {
    console.error("[chat/preferences] PATCH:", err);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}