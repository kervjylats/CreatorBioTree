/**
 * Rate Limiter — Interface + Mock Implementation
 *
 * When ready for production, implement `UpstashRateLimiter` using
 * @upstash/ratelimit + @upstash/redis (10k commands/day free).
 * See docs/EXTERNAL_SERVICES.md for setup steps.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

if (process.env.NODE_ENV === "production" && process.env.USE_MOCKS !== "true") {
  throw new Error(
    "In-memory rate limiter is not production-safe. Configure Upstash before deploying to production.",
  );
}

export interface IRateLimiter {
  /** Returns true if the request is allowed, false if rate limited. */
  check(key: string, limit: number, windowMs: number): Promise<boolean>;
}

// ─── In-Memory Mock ──────────────────────────────────────────────────────────

const requestLog = new Map<string, number[]>();

/** Works locally with zero external dependencies. Not suitable for production. */
export class InMemoryRateLimiter implements IRateLimiter {
  async check(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const timestamps = requestLog.get(key) ?? [];

    // Prune expired entries
    const recent = timestamps.filter((t) => now - t < windowMs);
    requestLog.set(key, recent);

    if (recent.length >= limit) return false;

    recent.push(now);
    requestLog.set(key, recent);
    return true;
  }
}

// ─── Production (commented — ready to activate) ─────────────────────────────
//
// export class UpstashRateLimiter implements IRateLimiter {
//   private limiter;
//   constructor() {
//     const redis = new Redis({
//       url: process.env.UPSTASH_REDIS_URL!,
//       token: process.env.UPSTASH_REDIS_TOKEN!,
//     });
//     this.limiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`) });
//   }
//   async check(key: string, limit: number, windowMs: number): Promise<boolean> {
//     const result = await this.limiter.limit(key);
//     return result.success;
//   }
// }

// ─── Singleton ───────────────────────────────────────────────────────────────

export const rateLimiter: IRateLimiter = new InMemoryRateLimiter();

// ————————————————————————————————————————————————————————————————
// Shared route wrapper (duplication audit 2026-09-29 #13)
// ————————————————————————————————————————————————————————————————

/**
 * enforceRateLimit — the IP-extract + check + 429 boilerplate every rate-limited
 * route re-writes (13 routes). Returns a ready 429 response when blocked, null
 * when allowed. IP = first x-forwarded-for hop (the old pageview-only variant),
 * with x-real-ip / "unknown" fallbacks.
 *
 * Usage: `const tooMany = await enforceRateLimit(request, "fan/login", 10, 60_000); if (tooMany) return tooMany;`
 */
export async function enforceRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const allowed = await rateLimiter.check(`${key}:${ip}`, limit, windowMs);
  if (allowed) return null;
  return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
}