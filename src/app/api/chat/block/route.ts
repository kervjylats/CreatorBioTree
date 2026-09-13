/**
 * POST /api/chat/block — block a person (messaging.md Part 2 privacy): a
 * blocked party can't DM you or be added to your chats; you unblock from the
 * block list (GET /api/chat/blocks). Available to every party.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

const blockSchema = z.object({
  other_key: z.string().min(1).max(100),
  other_party: z.enum(["creator", "fan"]).optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = blockSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Missing target" }, { status: 400 });
    const target = validation.data.other_key;
    if (target === me.key) return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });

    const { data: existing } = await supabase
      .from("blocked_users")
      .select("blocker_key")
      .eq("blocker_key", me.key)
      .eq("blocked_key", target)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Already blocked" }, { status: 409 });

    await supabase
      .from("blocked_users")
      .insert({
        blocker_key: me.key,
        blocked_key: target,
        blocked_party: (me.party === "creator" ? "fan" : "creator") as "fan" | "creator",
        created_at: new Date().toISOString(),
      });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/block] POST:", err);
    return NextResponse.json({ error: "Failed to block" }, { status: 500 });
  }
}