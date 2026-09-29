/**
 * Settings tab screen — /[username]/settings (fan-shell.md Part 4): identity
 * card, email-keyed receipts, install + notify. Fan-only.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { FanAppShell } from "@/components/fan-pwa/FanAppShell";
import { FanSettingsTab } from "@/components/fan-pwa/FanSettingsTab";
import { redirectIfNotFan } from "@/lib/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsScreen({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await resolveFanShellData(username);
  if (!data) notFound();
  redirectIfNotFan(username, data.identity);

  return (
    <FanAppShell branding={data.branding} creatorId={data.branding.creatorId}>
      <FanSettingsTab data={data} />
    </FanAppShell>
  );
}