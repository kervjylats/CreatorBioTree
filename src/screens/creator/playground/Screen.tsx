/**
 * Playground screen — /dashboard/playground (playground.md Parts 1 + 1d).
 * Server component shell; the client PlaygroundForm loads the creator +
 * catalog via GET /api/creator/playground. Top-level switch: Fans (phone
 * frame + Draft/Live/Deploy) | Billboard (result-preview + billboard editors
 * — /dashboard/playground?view=billboard). ?tab= deep-links a fan surface
 * inside Fans view (guest/home/content/connect/settings).
 */
import type { Metadata } from "next";
import { PlaygroundForm } from "@/components/playground/PlaygroundForm";

export const metadata: Metadata = {
  title: "Playground",
};

interface PlaygroundPageProps {
  searchParams?: Promise<{ tab?: string; view?: string }>;
}

export default async function PlaygroundScreen({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;
  return <PlaygroundForm initialTab={params?.tab} initialView={params?.view} />;
}
