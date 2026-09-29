/**
 * Content tab screen — /[username]/content (fan-shell.md Part 4b): the SAME
 * 3-layer view as the guest page, inside the 4-tab fan app. Fan-only.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { FanAppShell } from "@/components/fan-pwa/FanAppShell";
import { FanContentTab } from "@/components/fan-pwa/FanContentTab";
import { redirectIfNotFan } from "@/lib/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content",
};

export default async function ContentScreen({
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
      <FanContentTab data={data} />
    </FanAppShell>
  );
}