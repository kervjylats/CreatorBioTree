/**
 * GET /api/discover/creators/[id] — billboard-modal payload (network.md
 * CreatorBillboardModal, 2026-10-07): full billboard fields for ONE creator by
 * id — any creator with a username (404 for unknown/username-less ids only;
 * the hidden-creator 404 died with the show_in_search switch, 2026-10-09 —
 * closed creators must open from typed search).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limiter";

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
        "id, username, display_name, avatar_url, tagline, tags, collab_style, bio, rate_card, media_kit_message, open_to_collab, is_featured"
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

    return NextResponse.json({
      creator: {
        id: creator.id,
        username: creator.username,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
        tagline: creator.tagline ?? "",
        tags: creator.tags ?? [],
        collab_style: creator.collab_style ?? "",
        bio: creator.bio ?? "",
        rate_card: creator.rate_card ?? { post: "", story: "", video: "" },
        media_kit_message: creator.media_kit_message ?? "",
        is_featured: creator.is_featured,
        open_to_collab: creator.open_to_collab !== false,
      },
    });
  } catch (err) {
    console.error("[discover/creators/[id]] GET:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
