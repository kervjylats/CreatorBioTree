/** GET /api/fan/partners — old backup. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const idSchema = USE_MOCKS ? z.string().min(1) : z.string().uuid();
const querySchema = z.object({ creator_id: idSchema });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({ creator_id: searchParams.get("creator_id") });
    if (!validation.success) return NextResponse.json({ error: "creator_id required" }, { status: 400 });

    const { creator_id } = validation.data;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("partnerships")
      .select("*, creator_a_info:creator_a(id, username, display_name, avatar_url, bio, custom_theme), creator_b_info:creator_b(id, username, display_name, avatar_url, bio, custom_theme)")
      .eq("status", "active")
      .or(`creator_a.eq.${creator_id},creator_b.eq.${creator_id}`);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[fan/partners]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
