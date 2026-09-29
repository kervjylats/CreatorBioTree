/**
 * Home tab screen — /[username]/home (fan-shell.md Part 4a): branded welcome +
 * smart live-stack sections. Follower/visitor sessions bounce back to /guest —
 * the 4-tab app is Fan-only (no-password render rule, Sheet 21).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { FanAppShell } from "@/components/fan-pwa/FanAppShell";
import { FanHomeTab } from "@/components/fan-pwa/FanHomeTab";
import { redirectIfNotFan } from "@/lib/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
};

export default async function HomeScreen({
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
      <FanHomeTab data={data} />
    </FanAppShell>
  );
}