/** Creator forgot-password (login.md Part 4) — no account enumeration; mock console-logs the reset, real mode uses Supabase auth reset email. */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { mockResendSend } from "@/lib/mocks/mockResend";
import { rateLimiter } from "@/lib/rate-limiter";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const { email } = validation.data;

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimiter.check(`creator-forgot-password:${ip}`, 3, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const supabase = await createClient();

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (creatorError) {
      console.error("[creator/forgot-password]", creatorError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Don't reveal whether the account exists — always return ok.
    if (!creator) {
      return NextResponse.json({ ok: true });
    }

    if (USE_MOCKS) {
      const resetToken = crypto.randomUUID();
      await mockResendSend({
        from: "CreatorBioTree <noreply@creatorpwa.app>",
        to: email.toLowerCase(),
        subject: "Reset your CreatorBioTree password",
        text: `Password reset link (mock): /reset-password?token=${resetToken}`,
      });
      return NextResponse.json({ ok: true, reset_token: resetToken });
    }

    // Production: Supabase auth sends the reset email natively.
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase());
    if (error) {
      console.error("[creator/forgot-password]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[creator/forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
