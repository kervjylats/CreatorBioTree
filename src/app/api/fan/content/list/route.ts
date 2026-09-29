/** Public catalog listing for a fan app / guest page */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { idSchema } from "@/lib/zod-helpers";
import { contentService } from "@/services/contentService";

const querySchema = z.object({ creator_id: idSchema });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({ creator_id: searchParams.get("creator_id") });
    if (!validation.success) return NextResponse.json({ error: USE_MOCKS ? "creator_id required" : "creator_id (UUID) required" }, { status: 400 });

    const { creator_id } = validation.data;
    const supabase = createServiceClient();
    // contentService.getForCreator throws on query error — this route's contract
    // is a 500 {error:"Failed to load content"} (not the outer "Internal error").
    let items;
    try {
      items = await contentService.getForCreator(creator_id, supabase);
    } catch {
      return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
    }
    return NextResponse.json(items);
  } catch (err) {
    console.error("[fan/content/list]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}