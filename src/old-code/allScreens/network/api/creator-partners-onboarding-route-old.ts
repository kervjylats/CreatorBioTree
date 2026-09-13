/** POST /api/creator/partners/onboarding — old backup. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const inviteCode = user.user_metadata?.invite_code;
    if (!inviteCode) {
      return NextResponse.json({ message: "No invite code found" });
    }

    const serviceSupabase = createServiceClient();

    const { data: invite, error: inviteError } = await serviceSupabase
      .from("partner_invites")
      .select("*")
      .eq("invite_code", inviteCode)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.log("Invalid or expired invite code:", inviteCode);
      return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 400 });
    }

    await serviceSupabase
      .from("partner_invites")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", invite.id);

    const { error: pError } = await serviceSupabase
      .from("partnerships")
      .insert({
        creator_a: invite.from_creator_id,
        creator_b: user.id,
        status: "active"
      });

    if (pError) {
      console.error("Failed to create partnership from invite:", pError);
    }

    await supabase.auth.updateUser({
      data: { invite_code: null }
    });

    return NextResponse.json({ success: true, partner_id: invite.from_creator_id });
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
