/** Fan follow-creator — email-only follow (fan-shell.md Part 1 Layer 1b): creates a NO-password fan_accounts row + fan_session cookie → Follower state. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { setFanSession } from "@/lib/fanSession";
import { z } from "zod";

const followSchema = z.object({
  email: z.string().email(),
  creator_username: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await rateLimiter.check(`fan-follow:${ip}`, 10, 60_000))) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const validation = followSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid email or username" }, { status: 400 });
    }

    const { email, creator_username } = validation.data;
    const supabase = createServiceClient();

    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("username", creator_username)
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const normalizedEmail = email.toLowerCase();

    // Find-or-create the follower row — NEVER clobber an existing row
    // (a Fan's password_hash must survive a follow; follow is identity, not auth).
    const { data: existing } = await supabase
      .from("fan_accounts")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("creator_id", creator.id)
      .maybeSingle();

    let fanId = existing?.id ?? null;
    if (!fanId) {
      const { data: inserted, error: insertError } = await supabase
        .from("fan_accounts")
        .insert({ email: normalizedEmail, creator_id: creator.id, password_hash: null, last_seen_at: new Date().toISOString() })
        .select("id")
        .single();
      if (insertError || !inserted) {
        console.error("[fan/follow-creator] Insert failed:", insertError);
        return NextResponse.json({ error: "Couldn't follow right now — try again" }, { status: 500 });
      }
      fanId = inserted.id;
    }

    // Same session cookie as fans — the render rule (no password_hash → follower)
    // keeps them on the personalized guest page, never the 4-tab app.
    const response = NextResponse.json({ followed: true, fan_id: fanId });
    await setFanSession(response, fanId, creator.id, supabase);
    return response;
  } catch (err) {
    console.error("[fan/follow-creator]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}