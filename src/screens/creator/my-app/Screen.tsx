/**
 * My App screen — /dashboard/my-app (my-app.md Part 1): the one full-screen
 * editor for the fan shell. Server component shell; the client MyAppForm
 * loads the creator + catalog via GET /api/creator/my-app (mock auto-login
 * covers auth on /dashboard/* in dev). Accepts ?tab= to deep-link to a
 * specific editor tab (e.g. /dashboard/my-app?tab=catalog).
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
  return (
    <main className="min-h-screen bg-background">
      <MyAppForm initialTab={params?.tab} />
    </main>
  );
}