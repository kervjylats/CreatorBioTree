/** type: component — Dashboard activity timeline showing setup progress steps (branding, content, traffic). */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SharePageButton } from "@/components/creator-dashboard/CreatorManagementWidgets";

interface DashboardTimelineProps {
  isProfileSetup: boolean;
  hasContent: boolean;
  hasViews: boolean;
  contentCount: number;
  viewCount: number;
  pageUrl: string;
  pageName: string;
}

export function DashboardTimeline({
  isProfileSetup, hasContent, hasViews,
  contentCount, viewCount, pageUrl, pageName,
}: DashboardTimelineProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-foreground">
        <span>⚡</span> Live Activity &amp; Action Center
      </h2>

      <div className="relative ml-3 space-y-8 border-l-2 border-border pl-6">
        {/* Step 1 — Branding */}
        <div className="relative">
          <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${isProfileSetup ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
          <div>
            <p className="text-sm font-bold text-foreground">Custom App Branding</p>
            <p className="mt-0.5 text-xs text-muted">
              {isProfileSetup
                ? "✓ Your display name, bio, and app icon previews are configured beautifully."
                : "Setup your logo, display name, and bio to customize your lockscreen app icon."}
            </p>
            {!isProfileSetup && (
              <Link href="/dashboard/playground" className="mt-2.5 inline-block">
                <Button variant="outline" size="sm">Setup branding →</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Step 2 — Content */}
        <div className="relative">
          <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${hasContent ? "bg-emerald-500" : "bg-border"}`} />
          <div>
            <p className="text-sm font-bold text-foreground">Add Premium Content</p>
            <p className="mt-0.5 text-xs text-muted">
              {hasContent
                ? `✓ You have uploaded ${contentCount} content items for your fans.`
                : "Upload your first PDF, audio track, video, or product to begin selling to fans."}
            </p>
            {!hasContent && (
              <Link href="/dashboard/playground" className="mt-2.5 inline-block">
                <Button variant="outline" size="sm">Add content +</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Step 3 — Bio link traffic */}
        <div className="relative">
          <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${hasViews ? "bg-emerald-500" : "bg-border"}`} />
          <div>
            <p className="text-sm font-bold text-foreground">Bio Link Traffic</p>
            <p className="mt-0.5 text-xs text-muted">
              {hasViews
                ? `✓ Your bio link is active! You have received ${viewCount} live views.`
                : "Paste your Page Link inside your TikTok/Instagram bio to drive fan installs."}
            </p>
            {!hasViews && <SharePageButton url={pageUrl} pageName={pageName} />}
          </div>
        </div>
      </div>
    </section>
  );
}
