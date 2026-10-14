/**
 * GET /api/discover/creators/[id] — billboard-modal payload (network.md modal,
 * hero spec 2026-10-14): full billboard fields + primary_field + the gated
 * featured_item (spotlight hero; paid = cover-only for strangers). 404 for
 * unknown/username-less ids only.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { toHeroMedia } from "@/lib/spotlightHero";
import type { ContentItem } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tooMany = await enforceRateLimit(req, "discover-creator", 60, 60_000);
    if (tooMany) return tooMany;

    const { id } = await params;
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: creator, error } = await supabase
      .from("creators")
      .select(
        "id, username, display_name, avatar_url, tagline, tags, collab_style, bio, rate_card, media_kit_message, open_to_collab, is_featured, primary_field"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[discover/creators/[id]] query error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Username-less (helper account) or unknown → same as never found.
    if (!creator || !creator.username) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Hero = the published featured item fans see (network.md §2). The viewer
    // is a stranger creator: identity null + no purchases, so paid items shape
    // cover-only (file_url stripped — 2026-10-01 audit law).
    const { data: featured } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", id)
      .eq("is_featured", true)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      creator: {
        id: creator.id,
        username: creator.username,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
        tagline: creator.tagline ?? "",
        tags: creator.tags ?? [],
        collab_style: creator.collab_style ?? "",
        primary_field: (creator as { primary_field?: string | null }).primary_field ?? "",
        bio: creator.bio ?? "",
        rate_card: creator.rate_card ?? { post: "", story: "", video: "" },
        media_kit_message: creator.media_kit_message ?? "",
        is_featured: creator.is_featured,
        open_to_collab: creator.open_to_collab !== false,
        featured_item: featured
          ? toHeroMedia(featured as ContentItem, null, new Set<string>())
          : null,
      },
    });
  } catch (err) {
    console.error("[discover/creators/[id]] GET:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
