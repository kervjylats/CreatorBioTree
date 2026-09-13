/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";

const MANIFEST = {
  name: "BioTree",
  short_name: "BioTree",
  description: "Premium PWA SaaS platform for creators",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#F7F5F0",
  theme_color: "#5A6A4A",
  orientation: "portrait",
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
  shortcuts: [
    {
      name: "BioTree",
      short_name: "BioTree",
      description: "Open BioTree",
      url: "/",
      icons: [{ src: "/icons/icon-192x192.png", sizes: "96x96" }],
    },
  ],
  categories: ["social", "lifestyle"],
  lang: "en",
  dir: "ltr",
};

export async function GET() {
  return NextResponse.json(MANIFEST, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
