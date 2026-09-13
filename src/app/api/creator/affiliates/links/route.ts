/**
 * GET /api/creator/affiliates/links — list affiliate links owned by the
 * authenticated creator, joined with deal info (network.md §7).
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("creator_id", user.id);

    const dealIds = [...new Set((links ?? []).map((l) => l.deal_id as string).filter(Boolean))];
    const dealMap = new Map<string, unknown>();
    if (dealIds.length > 0) {
      const { data: deals } = await supabase
        .from("affiliate_deals")
        .select("*")
        .in("id", dealIds);
      for (const d of deals ?? []) dealMap.set(d.id, d);
    }

    const enriched = (links ?? []).map((l) => ({
      ...l,
      deal: dealMap.get(l.deal_id) ?? null,
    }));

    return NextResponse.json({ links: enriched });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load links" }, { status: 500 });
  }
}
