/**
 * My App screen — /dashboard/my-app (my-app.md Part 1): preview-first for now.
 * Server component shell; the client MyAppForm loads the creator + catalog via
 * GET /api/creator/my-app and renders the phone frame (Draft/Live bar + the
 * real fan surfaces). Editor/catalog UI is deferred to a later design pass.
 * Accepts ?tab= to deep-link to a fan view (guest/home/content/connect/settings).
 */
import type { Metadata } from "next";
import { MyAppForm } from "@/components/my-app/MyAppForm";

export const metadata: Metadata = {
  title: "My App",
};

interface MyAppPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function MyAppScreen({ searchParams }: MyAppPageProps) {
  const params = await searchParams;
  return <MyAppForm initialTab={params?.tab} />;
}
