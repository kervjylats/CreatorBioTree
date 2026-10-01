/**
 * GET /api/creator/activity — the Overview activity feed (overview.md Part 3).
 * The `get_creator_activity` RPC answers with raw event rows ({type, email|amount,
 * created_at}); this route is where that becomes the shape the timeline renders
 * ({id, action, description, created_at}), newest first. The widget used to read
 * fields the RPC never sent — `description` came back undefined, so every row
 * rendered blank with the default icon (2026-10-01 audit).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

interface RawEvent {
  type?: string | null;
  email?: string | null;
  amount?: number | string | null;
  created_at?: string | null;
}

function describe(event: RawEvent): { action: string; description: string } {
  if (event.type === "purchase") {
    const amount = Number(event.amount ?? 0);
    return { action: "purchase", description: `A fan spent ${money(amount)}` };
  }
  if (event.type === "fan_joined") {
    return { action: "follow", description: `${event.email ?? "A fan"} joined your fans` };
  }
  return { action: "content", description: "New activity" };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error: rpcError } = await supabase.rpc("get_creator_activity", {
      p_creator_id: user.id,
    });

    if (rpcError) {
      console.error("Activity RPC error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const events = (Array.isArray(data) ? (data as RawEvent[]) : []).map((event) => {
      const { action, description } = describe(event);
      const createdAt = event.created_at ?? new Date().toISOString();
      return {
        // Stable across polls so React keys never collide or go undefined.
        id: `${event.type ?? "event"}:${event.email ?? ""}:${createdAt}`,
        action,
        description,
        created_at: createdAt,
      };
    });

    events.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return NextResponse.json(events);
  } catch (err) {
    console.error("Activity API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
