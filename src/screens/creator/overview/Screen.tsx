/**
 * Overview screen at /dashboard/overview — dashboard with stat cards,
 * activity timeline, quick action, QR code, and fan export.
 * Auth guard via requireAuth() in the dashboard layout.
 */
import type { Metadata } from "next";
import { StatCards } from "@/components/overview/StatCards";
import { ActivityTimeline } from "@/components/overview/ActivityTimeline";
import { QuickActions } from "@/components/overview/QuickActions";
import { QrCard } from "@/components/overview/QrCard";
import { FanExportButton } from "@/components/overview/FanExportButton";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewScreen() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <FanExportButton />
      </div>
      <StatCards />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ActivityTimeline />
          <QuickActions />
        </div>
        <div className="space-y-6">
          <QrCard />
        </div>
      </div>
    </main>
  );
}
