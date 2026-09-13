/** TODO: Add purpose docstring. */
import type { Creator } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const creatorService = {
  async getByUsername(
    username: string,
    supabase: SupabaseClient
  ): Promise<Creator> {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Creator not found: ${username}`);
    return data as Creator;
  },

  async getById(
    id: string,
    supabase: SupabaseClient
  ): Promise<Creator> {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Creator not found: ${id}`);
    return data as Creator;
  },
};
