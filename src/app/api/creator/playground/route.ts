/**
 * GET/PUT /api/creator/playground — the Playground editor's read + deploy endpoint
 * (playground.md Part 2/4b). GET returns the creator row (theme + identity +
 * social links) and the catalog; PUT persists a deploy: display_name, bio,
 * avatar_url, banner_url, custom_theme, connect_empty_text, social_links. Both are
 * auth-guarded — the write whitelists only the allowed profile/theme fields.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { zodErrorResponse } from "@/lib/zod-helpers";
import { BILLBOARD_LIMITS } from "@/lib/limits";

const deploySchema = z.object({
  display_name: z.string().min(1).max(80).nullable().optional(),
  // Shared cap, not a second number: the Billboard writes up to
  // BILLBOARD_LIMITS.bio (600) and a 501–600 char bio used to be accepted here
  // only to be rejected — locking the creator out of Deploy forever (2026-10-01 audit).
  bio: z.string().max(BILLBOARD_LIMITS.bio).nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  banner_url: z.string().max(500).nullable().optional(),
  custom_theme: z.record(z.unknown()).nullable().optional(),
  connect_empty_text: z.string().max(200).nullable().optional(),
  social_links: z.record(z.string()).nullable().optional(),
});

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: creator } = await supabase
      .from("creators")
      .select("id, username, display_name, bio, avatar_url, banner_url, theme_id, custom_theme, connect_empty_text, social_links")
      .eq("id", user.id)
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

    const { data: items } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", user.id)
      .order("sort_order", { ascending: true });

    // Overview StatCards consumers — every count is computed HERE so the widget
    // never invents one (2026-10-01 audit: a `?? 0` fallback silently rendered 0
    // because the field was never sent). "Sales" = completed purchases only,
    // matching fans/list, fans/[id] and fans/export.
    const { count: pageViews } = await supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id);
    const { count: fansCount } = await supabase
      .from("fan_accounts")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id);
    const { data: completedPurchases } = await supabase
      .from("fan_purchases")
      .select("amount_paid, currency")
      .eq("creator_id", user.id)
      .eq("status", "completed");
    const totalSales = (completedPurchases ?? []).reduce(
      (sum, row) => sum + (Number(row.amount_paid) || 0),
      0,
    );
    // The card must not assume a currency: report the one the creator's sales are
    // actually in (newest purchase wins), so a non-USD store shows the right
    // symbol instead of a silent "$".
    const totalSalesCurrency =
      completedPurchases?.find((row) => typeof row.currency === "string" && row.currency)?.currency ?? "usd";

    return NextResponse.json({
      creator,
      items: items ?? [],
      page_views: pageViews ?? 0,
      fans_count: fansCount ?? 0,
      total_sales: totalSales,
      total_sales_currency: totalSalesCurrency,
    });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/playground] GET:", err);
    return NextResponse.json({ error: "Failed to load Playground" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    const body = await request.json();
    const validation = deploySchema.safeParse(body);
    if (!validation.success) {
      return zodErrorResponse();
    }

    const { error: updateError } = await supabase
      .from("creators")
      .update(validation.data)
      .eq("id", user.id);

    if (updateError) {
      console.error("[creator/playground] PUT:", updateError);
      return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/playground] PUT:", err);
    return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
  }
}