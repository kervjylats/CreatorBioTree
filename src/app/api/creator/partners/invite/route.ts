/**
 * GET /api/creator/partners/invite — generate or retrieve a 7-day single-use
 * invite code for the authenticated creator (partnership.md Part 1).
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: existing } = await supabase
      .from("partner_invites")
      .select("invite_code")
      .eq("from_creator_id", user.id)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (existing) {
      const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding?invite=${existing.invite_code}`;
      return NextResponse.json({ code: existing.invite_code, url });
    }

    const code = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("partner_invites").insert({
      from_creator_id: user.id,
      invite_code: code,
      email: null,
      used_by: null,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding?invite=${code}`;
    return NextResponse.json({ code, url });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed to generate invite" }, { status: 500 });
  }
}
