/**
 * GET /api/creator/affiliates/discover — browse open affiliate deals from
 * other creators (network.md §7). Returns active deals where the caller
 * is neither owner nor promoter, so they can create a link to promote.
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: deals } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("status", "active")
      .neq("owner_id", user.id)
      .neq("promoter_id", user.id);

    return NextResponse.json({ deals: deals ?? [] });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load deals" }, { status: 500 });
  }
}
