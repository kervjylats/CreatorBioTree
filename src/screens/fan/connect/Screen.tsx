/**
 * Connect tab screen — /[username]/connect (fan-shell.md Part 4c): Artist Links
 * + empty state (partner billboard lands with Sheet 20). Fan-only.
 */
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { FanAppShell } from "@/components/fan-pwa/FanAppShell";
import { FanConnectTab } from "@/components/fan-pwa/FanConnectTab";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connect",
};

export default async function ConnectScreen({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await resolveFanShellData(username);
  if (!data) notFound();
  if (!data.identity?.hasPassword) redirect(`/${username}/guest`);

  return (
    <FanAppShell branding={data.branding} creatorId={data.branding.creatorId}>
      <FanConnectTab data={data} />
    </FanAppShell>
  );
}