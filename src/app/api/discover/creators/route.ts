/**
 * GET /api/discover/creators — public creator discovery (search.md). Filters
 * by show_in_search, matches on display_name/username via case-insensitive
 * partial match, ranks by exact-username → featured → partial → newest.
 * Accepts ?q= query param; empty = show all discoverable (featured first).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limiter";

interface CreatorRow {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  show_in_search: boolean | null;
  is_featured: boolean | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    // Anonymous and hit on every keystroke of the search box while it scans the
    // creators table — it needs a speed bump (2026-10-01 audit).
    const tooMany = await enforceRateLimit(req, "discover-creators", 60, 60_000);
    if (tooMany) return tooMany;

    const supabase = await createClient();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    // Mutual toggle: if the searching creator has collab search OFF, return nothing.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase
        .from("creators")
        .select("show_in_search")
        .eq("id", user.id)
        .maybeSingle();
      if (me && me.show_in_search === false) {
        return NextResponse.json({ results: [], query: q });
      }
    }

    // A NULL show_in_search means "never set", which the settings UI treats as ON
    // (`?? true`), so a strict `eq(true)` filter hid creators whose own toggle
    // reads as enabled — the creator vanished from Discover and from the landing
    // marquee (2026-10-01 audit). Match both states.
    const { data: creators, error } = await supabase
      .from("creators")
      .select("id, username, display_name, tagline, avatar_url, show_in_search, is_featured, created_at")
      .or("show_in_search.eq.true,show_in_search.is.null");

    if (error) {
      console.error("[discover/creators] query error:", error);
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
    console.error("[discover/creators] GET:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
