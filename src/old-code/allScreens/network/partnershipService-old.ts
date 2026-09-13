/** partnershipService — old backup. */
import type { Partnership, PartnershipStatus } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

export type { Partnership, PartnershipStatus };

export interface PartnershipStats {
  fans_referred:    number;
  referred_revenue: number;
  active_partners:  number;
  pending_requests: number;
}

export const partnershipService = {
  async getForCreator(
    creatorId: string,
    supabase: SupabaseClient
  ): Promise<Partnership[]> {
    const { data, error } = await supabase
      .from("partnerships")
      .select(`
        *,
        creator_a_info:creator_a (id, username, display_name, avatar_url),
        creator_b_info:creator_b (id, username, display_name, avatar_url)
      `)
      .or(`creator_a.eq.${creatorId},creator_b.eq.${creatorId}`);

    if (error) throw error;
    return (data ?? []) as Partnership[];
  },

  async request(
    senderId:       string,
    receiverId:     string,
    notes:          string | undefined,
    supabase:       SupabaseClient,
    commission_pct?: number,
  ): Promise<void> {
    const { error } = await supabase.from("partnerships").insert({
      creator_a: senderId,
      creator_b: receiverId,
      status:    "pending" satisfies PartnershipStatus,
      notes:     notes ?? null,
      commission_pct: commission_pct ?? 10,
    });
    if (error) throw error;
  },

  async update(
    id:      string,
    updates: Partial<Pick<Partnership, "status" | "commission_pct" | "notes">>,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase
      .from("partnerships")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("partnerships")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async getStats(
    creatorId: string,
    supabase:  SupabaseClient
  ): Promise<PartnershipStats> {
    const { data, error } = await supabase.rpc("get_creator_partnership_stats", {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    const row = data?.[0] ?? {};
    return {
      fans_referred:    Number(row.fans_referred)    || 0,
      referred_revenue: Number(row.referred_revenue) || 0,
      active_partners:  Number(row.active_partners)  || 0,
      pending_requests: Number(row.pending_requests) || 0,
    };
  },
};
