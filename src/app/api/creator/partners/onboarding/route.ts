/**
 * POST /api/creator/partners/onboarding — post-signup auto-connect: validate
 * invite code, mark used, create partnerships row (partnership.md Part 2).
 * All invite logic lives in lib/partnerInvites.ts (shared with the /onboarding
 * Screen's logged-in accept path, 2026-10-07).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumePartnerInvite } from "@/lib/partnerInvites";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const result = await consumePartnerInvite(supabase, user.id, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, partner: result.partner });
  } catch (err) {
    console.error("[partners/onboarding] POST:", err);
    return NextResponse.json({ error: "Failed to process invite" }, { status: 500 });
  }
}
