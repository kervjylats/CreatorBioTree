/**
 * GET/PUT /api/creator/playground — the Playground editor's read + deploy endpoint
 * (playground.md Part 2/4b). GET returns the creator row (theme + identity +
 * social links) + the catalog; PUT persists a deploy write. Identity fields carry
 * the settings.md Part 13 7-day cooldown (founder 2026-10-09): a real change locks
 * that field, answering 409 { error, retry_at }; identical-value saves pass.
 * usePlaygroundForm strips identity from Deploy — enforcement targets Settings →
 * Profile writes (the one edit home). Both methods auth-guarded, whitelist-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { zodErrorResponse } from "@/lib/zod-helpers";
import { BILLBOARD_LIMITS, IDENTITY_COOLDOWN_DAYS, identityUnlock } from "@/lib/limits";

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
      .select("id, username, display_name, bio, avatar_url, display_name_changed_at, avatar_changed_at, banner_url, theme_id, custom_theme, connect_empty_text, social_links")
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

/** "Oct 16, 2026" — human unlock date for the cooldown 409 copy. */
function unlockLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    const body = await request.json();
    const validation = deploySchema.safeParse(body);
    if (!validation.success) {
      return zodErrorResponse();
    }

    // Current identity state — the cooldown needs both current values AND their
    // last-change stamps (settings.md Part 13).
    const { data: current, error: currentError } = await supabase
      .from("creators")
      .select("display_name, avatar_url, display_name_changed_at, avatar_changed_at")
      .eq("id", user.id)
      .maybeSingle();
    if (currentError) {
      console.error("[creator/playground] PUT read:", currentError);
      return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
    }
    if (!current) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

    const patch: Record<string, unknown> = { ...validation.data };
    let displayNameChangedAt = (current.display_name_changed_at as string | null) ?? null;
    let avatarChangedAt = (current.avatar_changed_at as string | null) ?? null;

    // One rule per cooldown field: lock ONLY on a real value change — an
    // identical-value save never stamps, never locks (so shared payloads can't
    // trip it by accident).
    const identityLock = (
      field: "display_name" | "avatar_url",
      label: string,
    ): NextResponse | null => {
      if (!(field in patch) || patch[field] === undefined) return null;
      const next = (patch[field] as string | null) ?? null;
      const prev = (current[field] as string | null) ?? null;
      if (next === prev) return null;

      const stampField = field === "display_name" ? "display_name_changed_at" : "avatar_changed_at";
      const lastStr = (current[stampField] as string | null) ?? null;
      const last = lastStr ? Date.parse(lastStr) : NaN;
      if (Number.isFinite(last) && Date.now() - last < IDENTITY_COOLDOWN_DAYS * 86_400_000) {
        const retryAt = identityUnlock(new Date(last));
        return NextResponse.json(
          { error: `You can change ${label} again on ${unlockLabel(retryAt)}.`, retry_at: retryAt },
          { status: 409 },
        );
      }

      const nowIso = new Date().toISOString();
      patch[stampField] = nowIso;
      if (stampField === "display_name_changed_at") displayNameChangedAt = nowIso;
      else avatarChangedAt = nowIso;
      return null;
    };

    const nameBlocked = identityLock("display_name", "your display name");
    if (nameBlocked) return nameBlocked;
    const avatarBlocked = identityLock("avatar_url", "your photo");
    if (avatarBlocked) return avatarBlocked;

    const { error: updateError } = await supabase
      .from("creators")
      .update(patch)
      .eq("id", user.id);

    if (updateError) {
      console.error("[creator/playground] PUT:", updateError);
      return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
    }

    // Return both stamps so ProfileSection can set its lock state without a refetch.
    return NextResponse.json({
      success: true,
      display_name_changed_at: displayNameChangedAt,
      avatar_changed_at: avatarChangedAt,
    });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/playground] PUT:", err);
    return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
  }
}