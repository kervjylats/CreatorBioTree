/**
 * Guest screen — /[username]/guest (fan-shell.md Part 3): the 3-layer view
 * (Header → Spotlight → Catalog) + the email-only Follow gate. Visitors and
 * Followers (no-password sessions) land here; Fans redirect into the 4-tab app.
 * When the OWNER views their own live page, an unpublished-draft strip mounts
 * on top (OwnerDraftBanner — Draft vs Live clarity, founder 2026-10-15).
 */
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { getSessionUserId } from "@/lib/guards";
import { GuestPageContent } from "@/components/fan-pwa/GuestPageContent";
import { OwnerDraftBanner } from "@/components/fan-pwa/OwnerDraftBanner";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fan page",
};

export default async function GuestScreen({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await resolveFanShellData(username);
  if (!data) notFound();

  // No-password render rule (WIRING_PLAN Sheet 21): only password-bearing
  // sessions get the 4-tab app — Followers stay on the personalized guest page.
  if (data.identity?.hasPassword) {
    redirect(`/${username}/home`);
  }

  // Owner on their own live page → the unpublished-draft strip may mount
  // (fans/strangers get no session match, so the banner never renders for them).
  const viewerId = await getSessionUserId();
  const isOwner = viewerId !== null && viewerId === data.branding.creatorId;

  return (
    <>
      <PageViewTracker creatorId={data.branding.creatorId} />
      {isOwner && <OwnerDraftBanner creatorId={data.branding.creatorId} />}
      <GuestPageContent data={data} />
    </>
  );
}