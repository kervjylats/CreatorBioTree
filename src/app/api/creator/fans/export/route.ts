/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = createServiceClient();

    // 1. Get all fans of this creator
    const { data: fans, error: fansError } = await serviceSupabase
      .from("fan_accounts")
      .select("id, email, created_at, referred_by")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (fansError) return NextResponse.json({ error: fansError.message }, { status: 500 });

    // 2. For each fan, get their purchases, views, reactions, comments
    const fanIds = (fans ?? []).map(f => f.id);

    // Purchases
    const { data: purchases } = await serviceSupabase
      .from("fan_purchases")
      .select("fan_id, amount_paid, currency, status, purchased_at, content_items(title)")
      .in("fan_id", fanIds)
      .order("purchased_at", { ascending: false });

    // Page views (only this creator's content)
    const { data: views } = await serviceSupabase
      .from("page_views")
      .select("fan_id, content_item_id, viewed_at, content_items(type, title)")
      .eq("creator_id", user.id)
      .in("fan_id", fanIds)
      .order("viewed_at", { ascending: false });

    // Reactions
    const { data: reactions } = await serviceSupabase
      .from("content_reactions")
      .select("fan_id, reaction_type, content_items(title)")
      .in("fan_id", fanIds)
      .order("created_at", { ascending: false });

    // Comments
    const { data: comments } = await serviceSupabase
      .from("content_comments")
      .select("fan_id, content, created_at, content_items(title)")
      .in("fan_id", fanIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    // 3. Build the CSV rows
    const rows: string[][] = [];
    
    // Header
    rows.push([
      "Fan Email", "Joined Date", "Referred By",
      "Purchases (Total)", "Total Spent ($)", "Last Purchase Date", "Purchased Items",
      "Page Views", "Last View Date",
      "Reactions Given",
      "Comments Posted"
    ]);

    for (const fan of (fans ?? [])) {
      const fanPurchases = (purchases ?? []).filter(p => p.fan_id === fan.id);
      const fanViews = (views ?? []).filter(v => v.fan_id === fan.id);
      const fanReactions = (reactions ?? []).filter(r => r.fan_id === fan.id);
      const fanComments = (comments ?? []).filter(c => c.fan_id === fan.id);

      const totalSpent = fanPurchases
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0);

      rows.push([
        fan.email,
        new Date(fan.created_at).toISOString().split("T")[0],
        fan.referred_by ?? "",

        // Purchases
        fanPurchases.length.toString(),
        totalSpent.toFixed(2),
        fanPurchases[0]?.purchased_at?.split("T")[0] ?? "",
        fanPurchases.map(p => `${(p as any).content_items?.title ?? "Unknown"} (${p.status})`).join("; "),

        // Views
        fanViews.length.toString(),
        fanViews[0]?.viewed_at?.split("T")[0] ?? "",

        // Reactions
        fanReactions.map(r => `${r.reaction_type} on ${(r as any).content_items?.title ?? "Unknown"}`).join("; "),

        // Comments
        fanComments.length.toString(),
      ]);
    }

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fan-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Fan report export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
