/** Fan purchases list — GET /api/fan/purchases?creator_id= returns the session email's completed purchases (fan-shell.md decision #12: receipts are email-keyed, server-side truth). */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getFanSession } from "@/lib/fanSession";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const idSchema = USE_MOCKS ? z.string().min(1) : z.string().uuid();

export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creator_id");
    if (!creatorId) {
      return NextResponse.json({ error: "creator_id is required" }, { status: 400 });
    }
    if (!idSchema.safeParse(creatorId).success) {
      return NextResponse.json({ error: "Invalid creator_id" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const session = await getFanSession(request.cookies, supabase);
    if (!session || session.creatorId !== creatorId) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: purchases, error } = await supabase
      .from("fan_purchases")
      .select("*")
      .eq("fan_id", session.fanId)
      .eq("status", "completed")
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("[fan/purchases] query failed:", error);
      return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
    }

    return NextResponse.json({ purchases: purchases ?? [] });
  } catch (err) {
    console.error("[fan/purchases]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}