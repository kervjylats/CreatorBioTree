/** Fan dashboard — returns subscriptions, unlocked content, referral info. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { fanService, type FanDashboardData } from "@/services/fanService";
import { getFanSession } from "@/lib/fanSession";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const session = await getFanSession(request.cookies, supabase);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dashboardData: FanDashboardData;
    try {
      dashboardData = await fanService.getDashboardData(session.email, supabase);
    } catch (err) {
      const message = (err as Error).message ?? "";
      if (message.toLowerCase().includes("not found")) {
        return NextResponse.json({ error: "Data not found" }, { status: 404 });
      }
      throw err;
    }

    const { data: referral } = await supabase
      .from("fan_accounts")
      .select("referred_by, creators!fan_accounts_referred_by_fkey(username, display_name)")
      .eq("email", session.email)
      .not("referred_by", "is", null)
      .limit(1)
      .single();

    return NextResponse.json({
      email: session.email,
      subscriptions: dashboardData.creators.map(c => ({
        creator: c,
        fan_id: dashboardData.fan_id,
      })),
      unlocked_content: dashboardData.purchased_items.map(p => ({
        ...p.content_items,
        purchased_at: p.purchased_at,
      })),
      referral: referral
        ? {
            referred_by: referral.referred_by,
            referred_by_username: (Array.isArray(referral.creators) ? referral.creators[0] : referral.creators)?.username ?? null,
            referred_by_display_name: (Array.isArray(referral.creators) ? referral.creators[0] : referral.creators)?.display_name ?? null,
          }
        : null,
    });
  } catch (err) {
    console.error("Fan Dashboard Error:", err);
    return NextResponse.json({ error: "Failed to fetch fan dashboard" }, { status: 500 });
  }
}
