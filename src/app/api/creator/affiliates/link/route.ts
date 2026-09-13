/**
 * POST /api/creator/affiliates/link — generate an affiliate link for a deal.
 * Creates an affiliate_links row with a unique ref_code (network.md §7,
 * monetization/creators.md Part 2e — automatic attribution via ref param).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const linkSchema = z.object({
  deal_id: z.string().min(1),
});

function generateRefCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuth();
    const body = await req.json();
    const validation = linkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "deal_id is required" }, { status: 400 });
    }

    const { data: deal } = await supabase
      .from("affiliate_deals")
      .select("id, status")
      .eq("id", validation.data.deal_id)
      .maybeSingle();

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    if (deal.status !== "active") {
      return NextResponse.json({ error: "Can only create links for active deals" }, { status: 400 });
    }

    const ref_code = generateRefCode();
    const now = new Date().toISOString();
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .insert({
        deal_id: validation.data.deal_id,
        creator_id: user.id,
        ref_code,
        active: true,
        click_count: 0,
        created_at: now,
      })
      .select("id, ref_code")
      .single();

    if (error) return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}
