/** Track fan install — uses session cookie to identify fan. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { fanService } from "@/services/fanService";
import { cookies } from "next/headers";
import { getFanSession } from "@/lib/fanSession";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const tooMany = await enforceRateLimit(request, "install", 10, 60_000);
    if (tooMany) return tooMany;

    const { creator_id, platform } = await request.json();
    if (!creator_id) return NextResponse.json({ error: "Missing creator_id" }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServiceClient();
    const session = await getFanSession(cookieStore, supabase, creator_id);
    const fanId = session?.fanId ?? null;

    await fanService.trackInstall(creator_id, fanId, platform ?? "unknown", supabase);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Install track error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
