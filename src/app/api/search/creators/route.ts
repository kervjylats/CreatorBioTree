/**
 * GET /api/search/creators — public creator discovery (search.md). Filters
 * by is_discoverable, matches on display_name/username via case-insensitive
 * partial match, ranks by exact-username → featured → partial → newest.
 * Accepts ?q= query param; empty = show all discoverable (featured first).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreatorRow {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  is_discoverable: boolean | null;
  is_featured: boolean | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    // Mutual toggle: if the searching creator has collab search OFF, return nothing.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase
        .from("creators")
        .select("is_discoverable")
        .eq("id", user.id)
        .maybeSingle();
      if (me && me.is_discoverable === false) {
        return NextResponse.json({ results: [], query: q });
      }
    }

    const { data: creators, error } = await supabase
      .from("creators")
      .select("id, username, display_name, tagline, avatar_url, is_discoverable, is_featured, created_at")
      .eq("is_discoverable", true);

    if (error) {
      console.error("[search/creators] query error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    let results = (creators ?? []) as CreatorRow[];

    if (q) {
      const lowerQ = q.toLowerCase();

      // Score each creator for ranking.
      const scored = results.map((c) => {
        const username = c.username.toLowerCase();
        const displayName = c.display_name.toLowerCase();
        let score = 0;

        // Exact username match = highest.
        if (username === lowerQ) score = 1000;
        // Username starts with query.
        else if (username.startsWith(lowerQ)) score = 500;
        // Display name starts with query.
        else if (displayName.startsWith(lowerQ)) score = 400;
        // Username contains query.
        else if (username.includes(lowerQ)) score = 300;
        // Display name contains query.
        else if (displayName.includes(lowerQ)) score = 200;
        // No match — exclude.
        else return null;

        // Featured boost.
        if (c.is_featured) score += 100;

        return { ...c, score };
      }).filter(Boolean) as (CreatorRow & { score: number })[];

      // Sort: score desc, then featured, then newest.
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return String(b.created_at).localeCompare(String(a.created_at));
      });

      results = scored;
    } else {
      // Empty query — show all discoverable, featured first, then newest.
      results.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return String(b.created_at).localeCompare(String(a.created_at));
      });
    }

    return NextResponse.json({
      results: results.map((c) => ({
        id: c.id,
        username: c.username,
        display_name: c.display_name,
        tagline: c.tagline,
        avatar_url: c.avatar_url,
        is_featured: c.is_featured,
      })),
      query: q,
    });
  } catch (err) {
    console.error("[search/creators] GET:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
