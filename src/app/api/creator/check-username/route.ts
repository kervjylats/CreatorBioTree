/** Link Address availability check (onboarding.md) — anonymous, rate-limited; returns available + format reason. */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/rate-limiter";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await rateLimiter.check(`check-username:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const username = request.nextUrl.searchParams.get("username");
  const exclude = request.nextUrl.searchParams.get("exclude");

  if (!username || !USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const supabase = await createClient();
  let query = supabase.from("creators").select("id").eq("username", username.toLowerCase());

  if (exclude) {
    query = query.neq("id", exclude);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to check username" }, { status: 500 });

  return NextResponse.json({ available: !data, reason: data ? "taken" : null });
}
