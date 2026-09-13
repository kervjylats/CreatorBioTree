/** Forgot password — generates reset token, in mock mode returns it directly. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { rateLimiter } from "@/lib/rate-limiter";
import crypto from "crypto";

const forgotSchema = z.object({
  email: z.string().email(),
  creator_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { email, creator_id } = validation.data;

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimiter.check(`forgot-password:${ip}`, 3, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const supabase = createServiceClient();

    const { data: fan, error: fanError } = await supabase
      .from("fan_accounts")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("creator_id", creator_id)
      .maybeSingle();
    if (fanError) {
      console.error("[fan/forgot-password]", fanError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Don't reveal whether the account exists — always return ok
    if (!fan) {
      return NextResponse.json({ ok: true });
    }

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("fan_sessions").insert({
      token: resetToken,
      fan_email: email.toLowerCase(),
      creator_id,
      reset_token_expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
    if (insertError) {
      console.error("[fan/forgot-password]", insertError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (USE_MOCKS) {
      console.log(`[mock] Password reset link: /reset-password?token=${resetToken}`);
      return NextResponse.json({ ok: true, reset_token: resetToken });
    }

    // TODO: Send email with reset link via Resend (production)
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fan/forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
