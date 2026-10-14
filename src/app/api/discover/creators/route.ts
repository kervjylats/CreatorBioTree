/**
 * GET /api/discover/creators — public creator discovery (search.md + network.md
 * §1b). FB model: search always on, self excluded, username-less rows dropped.
 * ?q= ranks exact → featured → partial → tags/tagline → bio → newest. ?field=
 * narrows either view to one primary-field bucket (chips; unknown = ignored).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { PRIMARY_FIELD_BUCKETS } from "@/lib/limits";

interface CreatorRow {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  tags: string[] | null;
  bio: string | null;
  primary_field: string | null;
  avatar_url: string | null;
  open_to_collab: boolean | null;
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
    // Field filter (network.md §1b): one locked bucket narrows either view.
    // Unknown values are ignored (treated as All) — the client only sends
    // buckets, and forgiving beats 400ing a bookmarked URL.
    const rawField = req.nextUrl.searchParams.get("field")?.trim() ?? "";
    const field = (PRIMARY_FIELD_BUCKETS as readonly string[]).includes(rawField) ? rawField : "";

    const { data: { user } } = await supabase.auth.getUser();

    // No visibility filter since 2026-10-09 (FB model — search is a full
    // directory; `show_in_search` is parked, network.md §3). The willingness
    // pool for the default collab feed is filtered client-side.
    const { data: creators, error } = await supabase
      .from("creators")
      .select("id, username, display_name, tagline, tags, bio, primary_field, avatar_url, open_to_collab, is_featured, created_at");

    if (error) {
      console.error("[discover/creators] query error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Username-less rows (invited-admin helper accounts, `username: null`) are
    // not creators — exclude them: the scorer's c.username.toLowerCase() would
    // throw on null and 500 EVERY search (found 2026-10-07 during the Stop 07
    // tour; the landing marquee already filters these, the deal form uses ?.).
    let results = (creators ?? []).filter((c) => c.username) as CreatorRow[];

    // Never show the searcher their own card — the Connect button on it is a
    // guaranteed 400 ("Cannot send request to yourself") and no social app
    // lists you to yourself (founder 2026-10-09).
    if (user) results = results.filter((c) => c.id !== user.id);

    // Field pool filter FIRST (both views): exact bucket match only. The FB
    // directory rule holds inside the field — closed creators stay findable.
    if (field) results = results.filter((c) => c.primary_field === field);

    if (q) {
      const lowerQ = q.toLowerCase();

      // Score each creator for ranking (search.md Part 3: names first, then
      // discovery fields, bio last — a story, not labels).
      const scored = results.map((c) => {
        const username = c.username.toLowerCase();
        const displayName = (c.display_name ?? "").toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.map((t) => String(t).toLowerCase()) : [];
        const tagline = (c.tagline ?? "").toLowerCase();
        const bio = (c.bio ?? "").toLowerCase();
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
        // Tag equals / starts with query.
        else if (tags.some((t) => t === lowerQ || t.startsWith(lowerQ))) score = 150;
        // Tagline contains query.
        else if (tagline.includes(lowerQ)) score = 120;
        // Bio contains query.
        else if (bio.includes(lowerQ)) score = 80;
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
      // Empty query — show all discoverable (or the field pool when a chip is
      // active), featured first, then newest. The hub filters willing-only
      // client-side for its collab list.
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
        open_to_collab: c.open_to_collab !== false,
      })),
      query: q,
      field,
    });
  } catch (err) {
    console.error("[discover/creators] GET:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
