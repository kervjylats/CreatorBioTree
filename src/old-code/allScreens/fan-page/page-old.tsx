/** Fan page — renders PublicCreatorPage for guests or FanAppShell for authenticated fans. */
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveBranding } from "@/lib/branding";
import type { Creator } from "@/types";
import { FanAppShell } from "@/components/fan-pwa/FanAppShell";
import { PublicCreatorPage } from "@/components/fan-pwa/PublicCreatorPage";
import { getFanAccountForCreator } from "@/lib/fanSession";

/**
 * FAN PAGE — /[username]
 *
 * Two views depending on authentication:
 *   • Guest (no fan cookie) → PublicCreatorPage (Linktree-style single page)
 *   • Authenticated (fan_{creatorId} cookie) → FanAppShell (4-tab PWA)
 *
 * Each creator has their own namespaced cookie so fans can be logged into
 * multiple creators independently without collisions.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ username: string }>;
}

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const supabase = createServiceClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("id, username, display_name, bio, avatar_url, custom_theme, theme_id")
    .eq("username", username.toLowerCase())
    .single();

  if (!creator) return { title: "Not found" };

  const branding = resolveBranding(creator as Creator);

  return {
    title: branding.appName,
    description: branding.description,
    manifest: `/${username}/manifest.json`,
    icons: {
      apple: branding.appIconUrl,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: branding.appName,
    },
    openGraph: {
      title: branding.appName,
      description: branding.description,
      images: branding.appIconUrl ? [branding.appIconUrl] : [],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: branding.appName,
      description: branding.description,
      images: branding.appIconUrl ? [branding.appIconUrl] : [],
    },
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default async function CreatorFanPage({ params }: Props) {
  const { username } = await params;
  const supabase = createServiceClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!creator) notFound();

  const branding = resolveBranding(creator as Creator);

  // Check for existing fan session cookie (global token)
  const cookieStore = await cookies();
  const fanId = await getFanAccountForCreator(cookieStore, supabase, creator.id);
  const isAuthenticated = !!fanId;

  if (isAuthenticated) {
    return (
      <FanAppShell
        branding={branding}
        fanId={fanId!}
        creatorId={creator.id}
      />
    );
  }

  return (
    <PublicCreatorPage
      branding={branding}
    />
  );
}