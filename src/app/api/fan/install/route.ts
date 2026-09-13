/** Track fan install — uses session cookie to identify fan. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { fanService } from "@/services/fanService";
import { cookies } from "next/headers";
import { getFanSession } from "@/lib/fanSession";
import { rateLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimiter.check(`install:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const { creator_id, platform } = await request.json();
    if (!creator_id) return NextResponse.json({ error: "Missing creator_id" }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServiceClient();
    const session = await getFanSession(cookieStore, supabase);
    const fanId = session && session.creatorId === creator_id ? session.fanId : null;

    await fanService.trackInstall(creator_id, fanId, platform ?? "unknown", supabase);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Install track error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
