/**
 * GET /api/creator/earnings/sales — §1 of the Earnings screen: the creator's
 * completed fan sales (fan_purchases, status completed), newest first, with
 * item titles + buyer emails. The total is SUMMED SERVER-SIDE (the API
 * computes, the widget displays — 2026-10-01 audit law); report-only, 0%.
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

interface PurchaseRow {
  id: string;
  content_item_id: string;
  fan_id: string | null;
  amount_paid: number;
  currency: string | null;
  purchased_at: string | null;
  created_at?: string | null;
}

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: purchases } = await supabase
      .from("fan_purchases")
      .select("*")
      .eq("creator_id", user.id)
      .eq("status", "completed")
      .order("purchased_at", { ascending: false })
      .limit(100);
    const rows = (purchases ?? []) as PurchaseRow[];
    if (rows.length === 0) {
      return NextResponse.json({ sales: [], total: 0, currency: "USD", count: 0 });
    }

    const itemIds = [...new Set(rows.map((r) => r.content_item_id))];
    const fanIds = [...new Set(rows.map((r) => r.fan_id).filter(Boolean))] as string[];
    const [itemsRes, fansRes] = await Promise.all([
      supabase.from("content_items").select("id, title").in("id", itemIds),
      fanIds.length
        ? supabase.from("fan_accounts").select("id, email").in("id", fanIds)
        : Promise.resolve({ data: [] as Array<{ id: string; email: string | null }> }),
    ]);
    const titles = new Map(
      ((itemsRes.data ?? []) as Array<{ id: string; title: string | null }>).map((i) => [i.id, i.title ?? "Item"]),
    );
    const emails = new Map(
      ((fansRes.data ?? []) as Array<{ id: string; email: string | null }>).map((f) => [f.id, f.email]),
    );

    const sales = rows.map((r) => ({
      id: r.id,
      title: titles.get(r.content_item_id) ?? "Item",
      fan_email: r.fan_id ? (emails.get(r.fan_id) ?? null) : null,
      amount_paid: Number(r.amount_paid ?? 0),
      currency: r.currency ?? "USD",
      purchased_at: r.purchased_at ?? r.created_at ?? null,
    }));
    const total = sales.reduce((sum, s) => sum + s.amount_paid, 0);

    return NextResponse.json({ sales, total, currency: sales[0]?.currency ?? "USD", count: sales.length });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  }
}
