/**
 * Playground screen — /dashboard/playground (playground.md Part 1): preview-first for now.
 * Server component shell; the client PlaygroundForm loads the creator + catalog via
 * GET /api/creator/playground and renders the phone frame (Draft/Live bar + the
 * real fan surfaces). Editor/catalog UI is deferred to a later design pass.
 * Accepts ?tab= to deep-link to a fan view (guest/home/content/connect/settings).
 */
import type { Metadata } from "next";
import { PlaygroundForm } from "@/components/playground/PlaygroundForm";

export const metadata: Metadata = {
  title: "Playground",
};

interface PlaygroundPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function PlaygroundScreen({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;
  return <PlaygroundForm initialTab={params?.tab} />;
}
