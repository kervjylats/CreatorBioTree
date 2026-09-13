/** TODO: Add purpose docstring. */
import type { ContentItem, ContentType, AccessType } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

// Re-export shared types so callers that import from this module keep working
// without needing to update their import paths.
export type { ContentType, AccessType, ContentItem };

/**
 * Fields that are managed by the database engine and must never appear
 * in an INSERT or UPDATE payload — Supabase will reject them or silently
 * overwrite managed values.
 */
type SystemField = "id" | "created_at" | "updated_at" | "creators";

/**
 * Safe payload shape for writes. Strips all system-managed and virtual fields
 * so callers cannot accidentally send a full ContentItem object to `save()`.
 */
type ContentWritePayload = Omit<ContentItem, SystemField>;

// ─────────────────────────────────────────────────────────────────────────────

export const contentService = {
  /**
   * Returns all *published* content items for a creator, sorted by
   * `sort_order` ascending. Used for the public fan-PWA view.
   */
  async getForCreator(
    creatorId: string,
    supabase: SupabaseClient
  ): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ContentItem[];
  },

  /**
   * Returns *all* content items for a creator (published + drafts), sorted
   * by `sort_order` ascending. Used for the creator dashboard.
   */
  async getAllForCreator(
    creatorId: string,
    supabase: SupabaseClient
  ): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", creatorId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ContentItem[];
  },

  /**
   * Returns a single content item by ID, with the owning creator's public
   * fields joined (id, username, display_name, stripe_account_id).
   * Returns null if the item does not exist.
   */
  async getById(
    id: string,
    supabase: SupabaseClient
  ): Promise<ContentItem> {
    const { data, error } = await supabase
      .from("content_items")
      .select("*, creators(id, username, display_name, stripe_account_id)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Content item not found: ${id}`);
    return data as ContentItem;
  },

  /**
   * Insert a new content item or update an existing one.
   *
   * Provide `id` in the payload to trigger an UPDATE; omit it for an INSERT.
   *
   * System-managed fields (`id`, `created_at`, `updated_at`, `creators`) are
   * stripped from the payload before any DB call. This prevents callers from
   * accidentally sending a full ContentItem object and having Supabase reject
   * the request or silently overwrite managed timestamps.
   *
   * For UPDATEs, a secondary `.eq("creator_id", ...)` filter ensures creators
   * can never modify items that belong to another creator, even if RLS is
   * misconfigured.
   */
  async save(
    item: (Partial<ContentWritePayload> & { creator_id: string }) & { id?: string },
    supabase: SupabaseClient
  ): Promise<ContentItem> {
    // Destructure system fields out so they never reach the DB.
    const {
      id,
      created_at: _cAt,
      updated_at: _uAt,
      creators:   _cr,
      ...payload
    } = item as ContentItem & { id?: string };

    if (id) {
      const { data, error } = await supabase
        .from("content_items")
        .update(payload)
        .eq("id", id)
        .eq("creator_id", payload.creator_id) // belt-and-braces ownership check
        .select()
        .single();

      if (error) throw error;
      return data as ContentItem;
    }

    const { data, error } = await supabase
      .from("content_items")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as ContentItem;
  },

  /**
   * Permanently delete a content item by ID.
   *
   * The caller is responsible for verifying ownership (e.g. by checking
   * `creator_id` matches the authenticated user) before calling this method.
   * RLS on `content_items` provides a second layer of enforcement.
   */
  async delete(id: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};