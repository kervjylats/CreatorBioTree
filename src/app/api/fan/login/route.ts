/** Fan login — verifies password hash, sets session cookie. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { z } from "zod";
import { verifyPassword, setFanSession } from "@/lib/fanSession";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  creator_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const { email, password, creator_id } = validation.data;

    const tooMany = await enforceRateLimit(request, "login", 5, 60_000);
    if (tooMany) return tooMany;

    const supabase = createServiceClient();

    const { data: fan, error: lookupError } = await supabase
      .from("fan_accounts")
      .select("id, password_hash")
      .eq("email", email.toLowerCase())
      .eq("creator_id", creator_id)
      .maybeSingle();

    if (lookupError || !fan) {
      // Same message as a wrong password — never reveal whether an email is registered.
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, fan.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await supabase
      .from("fan_accounts")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", fan.id);

    const response = NextResponse.json({ fan_id: fan.id });
    await setFanSession(response, fan.id, creator_id, supabase, request.cookies);
    return response;
  } catch (err) {
    console.error("[fan/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
