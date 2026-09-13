/**
 * GET /api/creator/affiliates/earnings — return settled vs pending totals
 * and conversion list for the authenticated creator (network.md §7,
 * monetization/creators.md Part 2e2).
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: ownedDeals } = await supabase
      .from("affiliate_deals")
      .select("id")
      .eq("owner_id", user.id);
    const { data: promotedDeals } = await supabase
      .from("affiliate_deals")
      .select("id")
      .eq("promoter_id", user.id);

    const ownedIds = (ownedDeals ?? []).map((d) => d.id as string);
    const promotedIds = (promotedDeals ?? []).map((d) => d.id as string);

    const allDealIds = [...ownedIds, ...promotedIds];
    if (allDealIds.length === 0) {
      return NextResponse.json({ settled: 0, pending: 0, disputed: 0, conversions: [] });
    }

    const { data: conversions } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .in("deal_id", allDealIds);

    let settled = 0;
    let pending = 0;
    let disputed = 0;
    for (const c of conversions ?? []) {
      const amount = Number(c.promoter_cut ?? 0);
      if (c.settlement_status === "settled") settled += amount;
      else if (c.settlement_status === "disputed") disputed += amount;
      else pending += amount;
    }

    return NextResponse.json({
      settled,
      pending,
      disputed,
      conversions: conversions ?? [],
    });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
