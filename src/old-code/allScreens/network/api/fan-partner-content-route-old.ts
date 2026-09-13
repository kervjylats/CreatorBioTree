/** GET /api/fan/partner-content — old backup. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { z } from "zod";

const querySchema = z.object({
  creator_id: z.string().uuid(),
  partner_username: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      creator_id: searchParams.get("creator_id"),
      partner_username: searchParams.get("partner_username"),
    });
    if (!validation.success) return NextResponse.json({ error: "creator_id and partner_username required" }, { status: 400 });

    const { partner_username } = validation.data;
    const supabase = createServiceClient();

    const { data: partner, error: partnerErr } = await supabase
      .from("creators")
      .select("id, username, display_name, bio, avatar_url, custom_theme")
      .eq("username", partner_username.toLowerCase())
      .single();

    if (partnerErr || !partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const { data: content } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", partner.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ partner, content: content ?? [] });
  } catch (err) {
    console.error("[fan/partner-content]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
