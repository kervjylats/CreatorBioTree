/** TODO: Add purpose docstring — Route handler. */
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
    if (!validation.success) return NextResponse.json({ error: USE_MOCKS ? "creator_id required" : "creator_id (UUID) required" }, { status: 400 });

    const { creator_id } = validation.data;
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("content_items").select("*").eq("creator_id", creator_id).eq("is_published", true).order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[fan/content/list]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}