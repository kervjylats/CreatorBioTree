/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { getFanAccountForCreator } from "@/lib/fanSession";

// GET /api/fan/content/[id]/reactions - Fetch reaction counts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentItemId } = await params;
    const supabase = createServiceClient();
    const cookieStore = await cookies();

    // Resolve creator_id from the content item to read the right fan cookie
    const { data: item } = await supabase
      .from("content_items")
      .select("creator_id")
      .eq("id", contentItemId)
      .single();

    const fanCookieKey = `fan_${item?.creator_id ?? "none"}`;
    const fanId = cookieStore.get(fanCookieKey)?.value;

    const { data, error } = await supabase
      .from("content_reactions")
      .select("reaction_type, fan_id")
      .eq("content_item_id", contentItemId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const counts: Record<string, number> = {};
    const myReactions: string[] = [];

    (data || []).forEach((r: any) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      if (r.fan_id === fanId) {
        myReactions.push(r.reaction_type);
      }
    });

    return NextResponse.json({ counts, myReactions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}

// POST /api/fan/content/[id]/reactions - Toggle a reaction
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentItemId } = await params;
    const cookieStore = await cookies();
    const supabase = createServiceClient();

    const { data: item } = await supabase
      .from("content_items")
      .select("creator_id")
      .eq("id", contentItemId)
      .single();

    const fanId = item ? await getFanAccountForCreator(cookieStore, supabase, item.creator_id) : null;
    if (!fanId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reaction_type } = await req.json();

    // Check if exists
    const { data: existing } = await supabase
      .from("content_reactions")
      .select("id")
      .eq("content_item_id", contentItemId)
      .eq("fan_id", fanId)
      .eq("reaction_type", reaction_type)
      .single();

    if (existing) {
      // Remove
      await supabase.from("content_reactions").delete().eq("id", existing.id);
      return NextResponse.json({ status: "removed" });
    } else {
      // Add
      await supabase.from("content_reactions").insert({
        content_item_id: contentItemId,
        fan_id: fanId,
        reaction_type
      });
      return NextResponse.json({ status: "added" });
    }
  } catch {
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
