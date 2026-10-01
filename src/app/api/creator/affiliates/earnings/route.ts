/**
 * GET /api/creator/affiliates/earnings — settlement totals + conversion list for
 * the authenticated creator (network.md §7, monetization/creators.md Part 2e2).
 *
 * Direction matters: on a deal you PROMOTE, `promoter_cut` is money you earn; on
 * a deal you OWN, the same column is money you pay out. This route previously
 * summed `promoter_cut` across both and the card called the result "Total earned",
 * so a creator's payouts were reported as income. The two sides are now counted
 * separately and the widget shows them as such (2026-10-01 audit).
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

interface ConversionRow {
  deal_id?: string;
  promoter_cut?: number;
  owner_cut?: number;
  settlement_status?: string;
  [key: string]: unknown;
}

function emptyTotals() {
  return { settled: 0, pending: 0, disputed: 0 };
}

function accumulate(target: ReturnType<typeof emptyTotals>, amount: number, status: string | undefined) {
  if (status === "settled") target.settled += amount;
  else if (status === "disputed") target.disputed += amount;
  else target.pending += amount;
}

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
      .eq("promoter_id", user.id)
      .neq("owner_id", user.id);

    const ownedIds = new Set((ownedDeals ?? []).map((d) => d.id as string));
    const promotedIds = (promotedDeals ?? []).map((d) => d.id as string);
    const allDealIds = [...ownedIds, ...promotedIds];

    if (allDealIds.length === 0) {
      return NextResponse.json({
        ...emptyTotals(),
        earned: emptyTotals(),
        owed: emptyTotals(),
        conversions: [],
      });
    }

    const { data: conversions } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .in("deal_id", allDealIds);

    // earned = the promoter's cut on deals this creator promotes.
    // owed    = the promoter cut this creator owes on deals this creator owns.
    const earned = emptyTotals();
    const owed = emptyTotals();
    for (const c of (conversions ?? []) as ConversionRow[]) {
      const promoterCut = Number(c.promoter_cut ?? 0);
      const status = c.settlement_status;
      accumulate(ownedIds.has(String(c.deal_id)) ? owed : earned, promoterCut, status);
    }

    return NextResponse.json({
      // Flat keys stay for the existing "Settled/Pending/Disputed" tiles, now
      // scoped to what this creator actually earns.
      ...earned,
      earned,
      owed,
      conversions: conversions ?? [],
    });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
