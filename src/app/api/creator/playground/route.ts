/**
 * GET/PUT /api/creator/playground — the Playground editor's read + deploy endpoint
 * (playground.md Parts 2/4/1e). GET returns the creator row (theme + identity +
 * social links) + the catalog; PUT persists a deploy write. Identity fields carry
 * 7-day cooldowns (settings.md Part 13 + Part 1e app locks): a real change locks
 * that field, answering 409 { error, retry_at }; identical-value saves pass. The
 * 📌 note's Deploy is the write path for every identity field now.
 * Both methods auth-guarded, whitelist-only.
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
      .select("id, username, display_name, bio, avatar_url, display_name_changed_at, avatar_changed_at, app_name_changed_at, app_icon_changed_at, banner_url, theme_id, custom_theme, connect_empty_text, social_links")
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

    // Current identity state — the cooldowns need current values AND their
    // last-change stamps (settings.md Part 13 + playground.md Part 1e app locks).
    const { data: current, error: currentError } = await supabase
      .from("creators")
      .select("display_name, avatar_url, display_name_changed_at, avatar_changed_at, app_name_changed_at, app_icon_changed_at, custom_theme")
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
    let appNameChangedAt = (current.app_name_changed_at as string | null) ?? null;
    let appIconChangedAt = (current.app_icon_changed_at as string | null) ?? null;

    // One rule per cooldown field: lock ONLY on a real value change — an
    // identical-value save never stamps, never locks (so shared payloads can't
    // trip it by accident).
    const lockOnRealChange = (
      next: string | null,
      prev: string | null,
      stampField: "display_name_changed_at" | "avatar_changed_at" | "app_name_changed_at" | "app_icon_changed_at",
      label: string,
      setStamp: (iso: string) => void,
    ): NextResponse | null => {
      // "" ≡ null (a null custom_theme stores appName/appIconUrl as "", and a
      // blank-string save must never count as a change or start a cooldown).
      const norm = (v: string | null) => (v === "" ? null : v);
      if (norm(next) === norm(prev)) return null;
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
      setStamp(nowIso);
      return null;
    };

    /** Top-level identity fields (display name / avatar). */
    const topLock = (field: "display_name" | "avatar_url", label: string): NextResponse | null => {
      if (!(field in patch) || patch[field] === undefined) return null;
      const next = (patch[field] as string | null) ?? null;
      const prev = (current[field] as string | null) ?? null;
      return lockOnRealChange(next, prev, field === "display_name" ? "display_name_changed_at" : "avatar_changed_at", label, (iso) => {
        if (field === "display_name") displayNameChangedAt = iso;
        else avatarChangedAt = iso;
      });
    };

    // App identity locks (playground.md Part 1e): appName/appIconUrl live inside
    // custom_theme.profile — same 7-day law, compared against the stored theme.
    const themePatch = (patch.custom_theme ?? null) as Record<string, unknown> | null;
    const themeProfile = (themePatch?.profile ?? null) as Record<string, unknown> | null;
    const currentTheme = (current.custom_theme ?? null) as Record<string, unknown> | null;
    const currentProfile = (currentTheme?.profile ?? null) as Record<string, unknown> | null;
    const appLock = (
      key: "appName" | "appIconUrl",
      stampField: "app_name_changed_at" | "app_icon_changed_at",
      label: string,
    ): NextResponse | null => {
      if (!themeProfile || !(key in themeProfile) || themeProfile[key] === undefined) return null;
      const next = (themeProfile[key] as string | null) ?? null;
      const prev = ((currentProfile?.[key] as string | null) ?? null);
      return lockOnRealChange(next, prev, stampField, label, (iso) => {
        if (stampField === "app_name_changed_at") appNameChangedAt = iso;
        else appIconChangedAt = iso;
      });
    };

    const nameBlocked = topLock("display_name", "your display name");
    if (nameBlocked) return nameBlocked;
    const avatarBlocked = topLock("avatar_url", "your photo");
    if (avatarBlocked) return avatarBlocked;
    const appNameBlocked = appLock("appName", "app_name_changed_at", "your app name");
    if (appNameBlocked) return appNameBlocked;
    const appIconBlocked = appLock("appIconUrl", "app_icon_changed_at", "your app icon");
    if (appIconBlocked) return appIconBlocked;

    const { error: updateError } = await supabase
      .from("creators")
      .update(patch)
      .eq("id", user.id);

    if (updateError) {
      console.error("[creator/playground] PUT:", updateError);
      return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
    }

    // Return all four stamps so the 📌 note can set lock state without a refetch.
    return NextResponse.json({
      success: true,
      display_name_changed_at: displayNameChangedAt,
      avatar_changed_at: avatarChangedAt,
      app_name_changed_at: appNameChangedAt,
      app_icon_changed_at: appIconChangedAt,
    });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/playground] PUT:", err);
    return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
  }
}