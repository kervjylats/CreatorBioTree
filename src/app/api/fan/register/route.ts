/** Fan register — creates fan_account with hashed password, sets session cookie. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";
import { hashPassword, setFanSession, verifyPassword } from "@/lib/fanSession";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  creator_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { email, password, creator_id } = validation.data;

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimiter.check(`register:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const supabase = createServiceClient();

    const { data: creator } = await supabase
      .from("creators")
      .select("id, username")
      .eq("id", creator_id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const { data: existingFan } = await supabase
      .from("fan_accounts")
      .select("id, password_hash")
      .eq("email", email.toLowerCase())
      .eq("creator_id", creator_id)
      .maybeSingle();

    if (existingFan) {
      if (!existingFan.password_hash) {
        return NextResponse.json(
          { error: "No password is set for this account. Use 'Forgot password' to set one." },
          { status: 401 },
        );
      }
      const valid = await verifyPassword(password, existingFan.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
      const response = NextResponse.json({ fan_id: existingFan.id, redirect: `/${creator.username}/home` });
      await setFanSession(response, existingFan.id, creator_id, supabase);
      return response;
    }

    const password_hash = await hashPassword(password);

    const { data: fan, error: insertError } = await supabase
      .from("fan_accounts")
      .insert({ email: email.toLowerCase(), creator_id, password_hash, last_seen_at: new Date().toISOString() })
      .select("id")
      .single();

    if (insertError || !fan) {
      console.error("[fan/register] Insert failed:", insertError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    const response = NextResponse.json({ fan_id: fan.id, redirect: `/${creator.username}/home` });
    await setFanSession(response, fan.id, creator_id, supabase);
    return response;
  } catch (err) {
    console.error("[fan/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
