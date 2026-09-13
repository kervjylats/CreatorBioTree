/** Backup — GET /api/creator/partners/stats. Uses partnershipService from wiredLater. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* partnershipService was imported here — moved to wiredLater */

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    /* was: partnershipService.getStats(user.id, supabase) */
    const { data: rpcData } = await supabase.rpc("get_creator_partnership_stats", { p_creator_id: user.id });
    const row = rpcData?.[0] ?? {};
    const formattedStats = {
      earned: Number(row.referred_revenue) || 0,
      owed: 0,
      recent_sales: [],
      fans_referred: Number(row.fans_referred) || 0,
      active_partners: Number(row.active_partners) || 0,
      pending_requests: Number(row.pending_requests) || 0,
    };
    return NextResponse.json(formattedStats);
  } catch (err) {
    console.error("Partnership stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
