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
  const amount = Number(event.amount ?? 0);
  if (event.type === "purchase") {
    return { action: "purchase", description: `A fan spent ${money(amount)}` };
  }
  if (event.type === "fan_joined") {
    return { action: "follow", description: `${event.email ?? "A fan"} joined your fans` };
  }
  // Settlement ledger events (earnings.md Part 5/7) — synthesized from the
  // immutable affiliate_conversions rows by the get_creator_activity RPC.
  if (event.type === "affiliate_earned") {
    return { action: "affiliate", description: `You earned ${money(amount)} from an affiliate deal` };
  }
  if (event.type === "payment_due") {
    return { action: "affiliate", description: `${money(amount)} became owed on your affiliate deal` };
  }
  if (event.type === "payment_overdue") {
    return { action: "affiliate", description: `Payment overdue: ${money(amount)}` };
  }
  if (event.type === "payment_marked") {
    return { action: "affiliate", description: `Payment of ${money(amount)} marked paid` };
  }
  if (event.type === "payment_confirmed") {
    return { action: "affiliate", description: `Payment of ${money(amount)} confirmed` };
  }
  if (event.type === "dispute_opened") {
    return { action: "affiliate", description: `Payment of ${money(amount)} disputed` };
  }
  // Deal-proposal events (messaging.md Part 2b, Batch B 2026-10-12) —
  // `email` carries the counterparty NAME for these synthesized events.
  const who = event.email ?? "a creator";
  if (event.type === "deal_proposed_by_me") {
    return { action: "affiliate", description: `You proposed a deal to ${who}` };
  }
  if (event.type === "deal_proposed_to_me") {
    return { action: "affiliate", description: `${who} proposed a deal to you` };
  }
  if (event.type === "deal_accepted_by_them") {
    return { action: "affiliate", description: `${who} accepted your deal proposal` };
  }
  if (event.type === "deal_accepted_by_me") {
    return { action: "affiliate", description: `You accepted ${who}'s deal proposal` };
  }
  if (event.type === "deal_declined_by_them") {
    return { action: "affiliate", description: `${who} declined your deal proposal` };
  }
  if (event.type === "deal_declined_by_me") {
    return { action: "affiliate", description: `You declined ${who}'s deal proposal` };
  }
  if (event.type === "deal_canceled_by_me") {
    return { action: "affiliate", description: `You canceled the deal proposal to ${who}` };
  }
  if (event.type === "deal_canceled_by_them") {
    return { action: "affiliate", description: `${who} canceled their deal proposal` };
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
        // Stable across polls so React keys never collide or go undefined —
        // amount joins the id because ledger events carry no email.
        id: `${event.type ?? "event"}:${event.email ?? ""}:${event.amount ?? ""}:${createdAt}`,
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
