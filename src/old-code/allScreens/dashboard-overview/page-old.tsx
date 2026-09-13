/** Dashboard overview — stats, activity timeline, QR code, fan export. */
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { QRCodeCard, FanExportButton, SharePageButton } from "@/components/creator-dashboard/CreatorManagementWidgets";
import { FanStatsCard } from "@/components/creator-dashboard/FanStatsCard";
import { StatCard } from "@/components/creator-dashboard/AnalyticsWidgets";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = creator?.role === "admin";

  let currentStats: Record<string, number>;
  if (isAdmin) {
    const { data: adminStats } = await supabase.rpc("get_admin_stats");
    currentStats = {
      view_count:    0,
      install_count: 0,
      content_count: adminStats?.totalCreators ?? 0,
      fan_count:     adminStats?.totalFans ?? 0,
      total_revenue: adminStats?.totalRevenue ?? 0,
    };
  } else {
    const { data: stats } = await supabase.rpc("get_creator_stats", {
      p_creator_id: user.id,
    });
    currentStats = stats?.[0] || {
      view_count:    0,
      install_count: 0,
      content_count: 0,
      fan_count:     0,
      total_revenue: 0,
    };
  }

  const headersList = await headers();
  const host        = headersList.get("host") || "creator-bio-tree.vercel.app";
  const protocol    = host.includes("localhost") ? "http" : "https";
  const username    = creator?.username ?? "creator";

  const pageUrl = creator?.custom_domain
    ? `https://${creator.custom_domain}`
    : `${protocol}://${host}/${username}`;

  const isProfileSetup = !!(creator?.display_name && creator?.bio && creator?.avatar_url);
  const hasContent     = Number(currentStats.content_count) > 0;
  const hasViews       = Number(currentStats.view_count) > 0;

  return (
    <div className="space-y-8">

      {/* ── Welcome header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Welcome back{creator?.display_name ? `, ${creator.display_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening with your page.
        </p>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Page views"
            value={Number(currentStats.view_count).toLocaleString()}
            icon="👁"
          />
          <StatCard
            label="App installs"
            value={Number(currentStats.install_count).toLocaleString()}
            icon="📲"
          />
          <StatCard
            label="Content items"
            value={Number(currentStats.content_count).toLocaleString()}
            icon="📦"
          />
          <FanStatsCard
            creatorId={user.id}
            creatorName={creator?.display_name ?? creator?.username ?? "Creator"}
            fanCount={Number(currentStats.fan_count)}
          />
          <StatCard
            label="Revenue"
            value={`$${Number(currentStats.total_revenue).toFixed(2)}`}
            icon="💰"
          />
        </div>
      </div>

      {/* ── Live Activity & Action Center ─────────────────────────────── */}
      <section className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-foreground">
          <span>⚡</span> Live Activity &amp; Action Center
        </h2>

        <div className="relative ml-3 space-y-8 border-l-2 border-border pl-6">

          {/* Step 1 — Branding */}
          <div className="relative">
            <span
              className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                isProfileSetup ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            <div>
              <p className="text-sm font-bold text-foreground">Custom App Branding</p>
              <p className="mt-0.5 text-xs text-muted">
                {isProfileSetup
                  ? "✓ Your display name, bio, and app icon previews are configured beautifully."
                  : "Setup your logo, display name, and bio to customize your lockscreen app icon."}
              </p>
              {!isProfileSetup && (
                <Link href="/dashboard/playground" className="mt-2.5 inline-block">
                  <Button variant="outline" size="sm">
                    Setup branding →
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Step 2 — Content */}
          <div className="relative">
            <span
              className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                hasContent ? "bg-emerald-500" : "bg-border"
              }`}
            />
            <div>
              <p className="text-sm font-bold text-foreground">Add Premium Content</p>
              <p className="mt-0.5 text-xs text-muted">
                {hasContent
                  ? `✓ You have uploaded ${currentStats.content_count} content items for your fans.`
                  : "Upload your first PDF, audio track, video, or product to begin selling to fans."}
              </p>
              {!hasContent && (
                <Link
                  href="/dashboard/playground"
                  className="mt-2.5 inline-block"
                >
                  <Button variant="outline" size="sm">
                    Add content +
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Step 3 — Bio link traffic */}
          <div className="relative">
            <span
              className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                hasViews ? "bg-emerald-500" : "bg-border"
              }`}
            />
            <div>
              <p className="text-sm font-bold text-foreground">Bio Link Traffic</p>
              <p className="mt-0.5 text-xs text-muted">
                {hasViews
                  ? `✓ Your bio link is active! You have received ${currentStats.view_count} live views.`
                  : "Paste your Page Link inside your TikTok/Instagram bio to drive fan installs."}
              </p>
              {!hasViews && <SharePageButton url={pageUrl} pageName={creator?.display_name ?? username} />}
            </div>
          </div>

        </div>
      </section>

      {/* ── Fan email export ──────────────────────────────────────────── */}
      <div>
        <FanExportButton />
      </div>

      {/* ── Your page link + QR code ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col justify-center rounded-3xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            Your page link
          </h2>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <span className="flex-1 truncate text-sm text-foreground">{pageUrl}</span>
            <SharePageButton
              url={pageUrl}
              pageName={creator?.display_name ?? username}
            />
          </div>
          <p className="mt-3 text-xs text-muted">
            Share this in your TikTok/Instagram bio. Fans can install it as an app.
          </p>
        </div>

        <QRCodeCard url={pageUrl} username={username} />
      </div>

    </div>
  );
}
