/** GET /api/creator/partners/invite — old backup. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { data: existing } = await supabase
      .from("partner_invites")
      .select("invite_code, expires_at")
      .eq("from_creator_id", userId)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: neu, error: insertError } = await supabase
      .from("partner_invites")
      .insert({
        from_creator_id: userId,
        invite_code: inviteCode,
        expires_at: expiresAt
      })
      .select("invite_code, expires_at")
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json(neu);
  } catch {
    return NextResponse.json({ error: "Failed to manage invite code" }, { status: 500 });
  }
}
