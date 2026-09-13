/** TODO: Add purpose docstring — Route handler. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

/**
 * POST /api/creator/pageview
 *
 * WHAT CHANGED:
 *   - Added IP-based in-memory rate limiting (max 5 requests per IP per minute).
 *     Without this, any script could send 100k fake views to any creator.
 *   - Added UUID format validation for creator_id. Before, any string was
 *     accepted and passed directly to the database.
 *   - Silently ignore (200 OK) rate-limited requests rather than returning 429,
 *     so client-side fetch().catch(() => {}) callers don't log noise.
 *
 * NOTE: In-memory rate limiting resets on Vercel cold starts. This is fine for
 * this use case — it stops casual abuse. For stricter limits, use Upstash Redis.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX        = 5;      // max 5 page views per IP per minute per creator

export async function POST(request: NextRequest) {
  try {
    const { creator_id, content_item_id } = await request.json();

    // Validate creator_id is a proper UUID — reject garbage values
    // (mock mode uses non-UUID ids like `mock-test-creator` — skip the format check there)
    if (!creator_id || (!USE_MOCKS && !UUID_REGEX.test(creator_id))) {
      return NextResponse.json({ error: "Invalid creator_id" }, { status: 400 });
    }

    // Optional content_item_id must also be a UUID if provided
    if (content_item_id && !USE_MOCKS && !UUID_REGEX.test(content_item_id)) {
      return NextResponse.json({ error: "Invalid content_item_id" }, { status: 400 });
    }

    // Resolve the real IP (Vercel forwards via x-forwarded-for)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    // Silently drop rate-limited requests — don't inflate error logs
    if (!(await rateLimiter.check(`pageview:${ip}:${creator_id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS))) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    await supabase.from("page_views").insert({
      creator_id,
      content_item_id: content_item_id ?? null,
      referrer: request.headers.get("referer") ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface errors to the client — this is a fire-and-forget endpoint
    return NextResponse.json({ ok: true });
  }
}
