/** Link Address availability check (onboarding.md) — anonymous, rate-limited; returns available + format reason. */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { USERNAME_PATTERN } from "@/lib/username";


export async function GET(request: NextRequest) {
  const tooMany = await enforceRateLimit(request, "check-username", 20, 60_000);
  if (tooMany) return tooMany;

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
