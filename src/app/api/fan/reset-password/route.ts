/** Reset password — accepts token + new password, updates hash. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { hashPassword } from "@/lib/fanSession";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { token, password } = validation.data;
    const supabase = createServiceClient();

    const { data: session } = await supabase
      .from("fan_sessions")
      .select("fan_email, creator_id, reset_token_expires_at")
      .eq("token", token)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (session.reset_token_expires_at && new Date(session.reset_token_expires_at) < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    const password_hash = await hashPassword(password);

    const { error: updateError } = await supabase
      .from("fan_accounts")
      .update({ password_hash })
      .eq("email", session.fan_email)
      .eq("creator_id", session.creator_id);

    if (updateError) {
      console.error("[fan/reset-password] Update failed:", updateError);
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fan/reset-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
