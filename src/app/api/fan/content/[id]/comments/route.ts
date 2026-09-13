/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { getFanAccountForCreator } from "@/lib/fanSession";

// GET /api/fan/content/[id]/comments - Fetch comments for a content item
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentItemId } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("content_comments")
      .select(`
        id,
        content,
        created_at,
        is_pinned,
        fan_id,
        fan_accounts (email)
      `)
      .eq("content_item_id", contentItemId)
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sanitize emails for display (e.g., "u***@gmail.com")
    const sanitizedData = (data || []).map((c: any) => ({
      ...c,
      fan_name: c.fan_accounts?.email 
        ? c.fan_accounts.email.split("@")[0].substring(0, 3) + "***" 
        : "Anonymous Fan"
    }));

    return NextResponse.json(sanitizedData);
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/fan/content/[id]/comments - Post a new comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentItemId } = await params;
    const cookieStore = await cookies();
    const supabase = createServiceClient();

    // Resolve creator_id from the content item to read the right fan cookie
    const { data: item } = await supabase
      .from("content_items")
      .select("creator_id")
      .eq("id", contentItemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const fanId = await getFanAccountForCreator(cookieStore, supabase, item.creator_id);
    if (!fanId) {
      return NextResponse.json({ error: "You must be signed in to comment" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("content_comments")
      .insert({
        content_item_id: contentItemId,
        fan_id: fanId,
        content: content.trim()
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
