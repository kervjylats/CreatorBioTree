/**
 * Settings screen at /dashboard/settings — stacked sections for profile,
 * payments, notifications, messaging privacy, and account actions.
 * Auth guard via requireAuth() in the dashboard layout.
 */
import type { Metadata } from "next";
import { YourPageSection } from "@/components/settings/YourPageSection";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PaymentsPanel } from "@/components/settings/PaymentsPanel";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { MessagingPrivacy } from "@/components/settings/MessagingPrivacy";
import { DangerZone } from "@/components/settings/DangerZone";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsScreen() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <YourPageSection />
      <ProfileSection />
      <PaymentsPanel />
      <NotificationsSection />
      <MessagingPrivacy />
      <DangerZone />
    </main>
  );
}
