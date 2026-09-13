/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveBranding } from "@/lib/branding";
import type { Creator } from "@/types";

/**
 * DYNAMIC PWA MANIFEST — Per-Creator
 *
 * Generates a unique manifest.json for each creator's installed PWA so fans
 * see the creator's own app name and icon on their phone — not the platform.
 *
 * All branding values come from `resolveBranding()` — the single source of truth.
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = createServiceClient();

  const { data: creator, error } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const branding = resolveBranding(creator as Creator);
  const shortName = branding.appName.split(" ").slice(0, 2).join(" ");

  const manifest = {
    id:               `/${username}`,
    name:             branding.appName,
    short_name:       shortName,
    description:      branding.description,
    start_url:        `/${username}/app`,
    scope:            `/${username}`,
    display:          "standalone",
    background_color: branding.backgroundColor,
    theme_color:      branding.accentColor,
    orientation:      "portrait",
    icons: [
      { src: branding.appIconUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: branding.appIconUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      {
        name:        "App",
        short_name:  "App",
        description: branding.description,
        url:         `/${username}/app`,
        icons:       [{ src: branding.appIconUrl, sizes: "96x96" }],
      },
    ],
    categories: ["lifestyle", "social"],
    lang:        "en",
    dir:         "ltr",
    // iOS-specific
    apple_mobile_web_app_capable:           "yes",
    apple_mobile_web_app_status_bar_style:  "black-translucent",
    apple_mobile_web_app_title:             branding.appName,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type":  "application/manifest+json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}