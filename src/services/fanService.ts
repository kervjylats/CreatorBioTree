/**
 * fanService — fan-side service helpers (install tracking).
 *
 * Historically also served `getDashboardData` for GET /api/fan/purchases-style
 * fan dashboard reads; removed 2026-09-28 (the route was dead — fanShellData.ts
 * serves the fan view server-side).
 */
import { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────

export const fanService = {
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
