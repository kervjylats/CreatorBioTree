/** Fan list CSV export for the Relationships screen — the ONE exporter (2026-10-01 audit). */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/** Fan status, matching the on-screen chips in FanListTable. */
type FanStatus = "all" | "new" | "paid" | "followers";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // The export honors the filter the creator has on screen (relationships.md
    // Part 3: "one button, respects the current filter").
    const statusParam = req.nextUrl.searchParams.get("status");
    const status: FanStatus =
      statusParam === "new" || statusParam === "paid" || statusParam === "followers" ? statusParam : "all";

    const serviceSupabase = createServiceClient();

    // 1. Get all fans of this creator
    const { data: fans, error: fansError } = await serviceSupabase
      .from("fan_accounts")
      .select("id, email, created_at, referred_by, do_not_contact, password_hash")
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

    // Header — each money/count column names its scope so two columns can never
    // look like they disagree (they filter differently on purpose).
    rows.push([
      "Fan Email", "Joined Date", "Referred By", "Status", "Do Not Contact",
      "Purchases (All)", "Total Spent (Completed, $)", "Last Purchase Date", "Purchased Items",
      "Page Views", "Last View Date",
      "Reactions Given",
      "Comments Posted"
    ]);

    for (const fan of (fans ?? [])) {
      const fanPurchases = (purchases ?? []).filter(p => p.fan_id === fan.id);
      const fanViews = (views ?? []).filter(v => v.fan_id === fan.id);
      const fanReactions = (reactions ?? []).filter(r => r.fan_id === fan.id);
      const fanComments = (comments ?? []).filter(c => c.fan_id === fan.id);

      const completedSpent = fanPurchases
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0);

      // Same rule as the on-screen chip: a fan is a Follower while they have no
      // password; "New" is a follower with no spend, "Paid" is any spend.
      const isFollower = !fan.password_hash;
      const statusLabel = completedSpent > 0 ? "Paid" : isFollower ? "New" : "Follower";

      // Filter is applied here, server-side, so the file matches the table.
      if (status === "followers" && !isFollower) continue;
      if (status === "paid" && completedSpent <= 0) continue;
      if (status === "new" && (completedSpent > 0 || !isFollower)) continue;

      rows.push([
        fan.email,
        new Date(fan.created_at).toISOString().split("T")[0],
        fan.referred_by ?? "",
        statusLabel,
        fan.do_not_contact ? "yes" : "no",

        // Purchases
        fanPurchases.length.toString(),
        completedSpent.toFixed(2),
        // Queries are ordered newest-first, so [0] really is the latest.
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
