/**
 * GET /api/admin/disputes — the settlement queue for the platform owner
 * (earnings.md Part 6): every DISPUTED conversion (admin picks a verdict) plus
 * GHOST rows — owner marked paid, promoter went silent past the 14-day confirm
 * window. Read-only; verdicts go through POST /resolve.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { canPerform, getAdminAccount } from "@/lib/admin-permissions";

const GHOST_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_disputes")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { data: rows, error } = await serviceClient
      .from("affiliate_conversions")
      .select("*")
      .in("settlement_status", ["disputed", "awaiting_confirm"]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const now = Date.now();
    const candidates = (rows ?? []).filter((r: Record<string, unknown>) => {
      if (r.settlement_status === "disputed") return true;
      const paidAt = r.owner_paid_at ? Date.parse(String(r.owner_paid_at)) : NaN;
      return !Number.isNaN(paidAt) && now - paidAt >= GHOST_MS;
    });
    if (candidates.length === 0) return NextResponse.json({ disputes: [] });

    const dealIds = [...new Set(candidates.map((r: Record<string, unknown>) => String(r.deal_id)))];
    const { data: deals } = await serviceClient
      .from("affiliate_deals")
      .select("id, owner_id, promoter_id, deal_type, rate, trigger")
      .in("id", dealIds);
    const dealMap = new Map(
      ((deals ?? []) as Array<{ id: string; owner_id: string; promoter_id: string }>).map((d) => [d.id, d]),
    );
    const creatorIds = [...new Set((deals ?? []).flatMap((d) => [d.owner_id, d.promoter_id]))];
    const { data: creators } = creatorIds.length
      ? await serviceClient.from("creators").select("id, display_name, username").in("id", creatorIds)
      : { data: [] as Array<{ id: string; display_name: string | null; username: string | null }> };
    const creatorMap = new Map(
      ((creators ?? []) as Array<{ id: string; display_name: string | null; username: string | null }>).map(
        (c) => [c.id, c],
      ),
    );
    const nameOf = (id: string) => {
      const c = creatorMap.get(id);
      return c ? (c.display_name || c.username || "creator") : "Unknown";
    };

    const disputes = candidates
      .map((r: Record<string, unknown>) => {
        const deal = dealMap.get(String(r.deal_id));
        const kind = r.settlement_status === "disputed" ? "dispute" : "ghost";
        return {
          id: r.id,
          kind,
          amount: Number(r.promoter_cut ?? 0),
          settlement_status: r.settlement_status,
          reason: r.dispute_reason ?? null,
          owner_paid_at: r.owner_paid_at ?? null,
          disputed_at: r.disputed_at ?? null,
          due_at: r.due_at ?? null,
          created_at: r.created_at ?? null,
          owner: deal ? { id: deal.owner_id, name: nameOf(deal.owner_id) } : null,
          promoter: deal ? { id: deal.promoter_id, name: nameOf(deal.promoter_id) } : null,
        };
      })
      .sort((a, b) => {
        const at = a.disputed_at ?? a.owner_paid_at ?? a.created_at ?? "";
        const bt = b.disputed_at ?? b.owner_paid_at ?? b.created_at ?? "";
        return String(at).localeCompare(String(bt));
      });

    return NextResponse.json({ disputes });
  } catch (err) {
    console.error("[admin/disputes]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
