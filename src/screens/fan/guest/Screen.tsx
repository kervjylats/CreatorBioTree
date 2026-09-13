/**
 * Guest screen — /[username]/guest (fan-shell.md Part 3): the 3-layer view
 * (Header → Spotlight → Catalog) + the email-only Follow gate. Visitors and
 * Followers (no-password sessions) land here; Fans redirect into the 4-tab app.
 */
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveFanShellData } from "@/lib/fanShellData";
import { GuestPageContent } from "@/components/fan-pwa/GuestPageContent";

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

  return <GuestPageContent data={data} />;
}