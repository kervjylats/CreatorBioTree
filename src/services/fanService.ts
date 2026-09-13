import type { Creator, ContentItem, FanPurchase } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── Derived types ────────────────────────────────────────────────────────────

/** Creator fields surfaced to the fan dashboard — no billing data exposed */
type FanCreatorRef = Pick<
  Creator,
  "id" | "username" | "display_name" | "avatar_url"
>;

/**
 * A completed purchase enriched with the content item and creator name.
 * The `content_items` and `creators` fields are populated by Supabase joins
 * and are not stored columns on `fan_purchases`.
 */
type FanPurchaseWithDetails = FanPurchase & {
  content_items: ContentItem | null;
  creators: Pick<Creator, "username" | "display_name"> | null;
};

// ─── Public interface ─────────────────────────────────────────────────────────

export interface FanDashboardData {
  fan_id:          string;
  creators:        FanCreatorRef[];
  purchased_items: FanPurchaseWithDetails[];
}

// ─────────────────────────────────────────────────────────────────────────────

export const fanService = {
  /**
   * Returns all data needed for a fan's personal dashboard.
   *
   * Fetches the fan's linked creator accounts and their completed purchases
   * in two targeted queries. Returns null when no fan accounts exist for the
   * given email address.
   */
  async getDashboardData(
    fanEmail: string,
    supabase: SupabaseClient
  ): Promise<FanDashboardData> {
    const { data: accounts, error: accountError } = await supabase
      .from("fan_accounts")
      .select("id, creator_id, creators(id, username, display_name, avatar_url)")
      .eq("email", fanEmail.toLowerCase());

    if (accountError) throw accountError;
    if (!accounts || accounts.length === 0) throw new Error(`No fan accounts found for email: ${fanEmail}`);

    const fanIds = accounts.map((a) => a.id as string);

    const { data: purchases } = await supabase
      .from("fan_purchases")
      .select("*, content_items(*), creators(username, display_name)")
      .in("fan_id", fanIds)
      .eq("status", "completed")
      .order("purchased_at", { ascending: false });

    return {
      fan_id:          accounts[0].id as string,
      creators: accounts.map((a) => (Array.isArray(a.creators) ? a.creators[0] : a.creators) as FanCreatorRef),
      purchased_items: (purchases ?? []) as FanPurchaseWithDetails[],
    };
  },

  /**
   * Record a PWA installation event for a creator.
   *
   * This is fire-and-forget — a tracking failure must never block the install
   * flow, so errors are logged as warnings rather than thrown.
   */
  async trackInstall(
    creatorId: string,
    fanId: string | null,
    platform: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase.from("fan_installs").insert({
      creator_id: creatorId,
      fan_id:     fanId,
      platform,
    });

    if (error) {
      console.warn("[fanService.trackInstall] Non-fatal tracking failure:", error.message);
    }
  },
};
