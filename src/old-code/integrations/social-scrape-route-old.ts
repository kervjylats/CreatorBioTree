/** TODO: Add purpose docstring. */
/**
 * OLD — src/app/api/creator/social/scrape/route.ts
 *
 * Unwired on 2026-07-30. This route did URL scraping for social link previews:
 * - Detected platform (IG, YT, TikTok, X, Spotify, Amazon, etc.)
 * - Tried platform-specific oEmbed for rich embeds
 * - Fell back to Open Graph meta tags for title/image/description
 * - No API keys required (public web standards)
 *
 * Being rebuilt from spec at integrations.md → "Social Links / URL Scraping"
 * to match the new vision: interactive rich cards instead of boring icons.
 */

// ─── Original code below (preserved as reference) ──────────────────────────

// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
//
// const scrapeSchema = z.object({
//   url: z.string().url(),
// });
//
// interface ScrapeResult {
//   title?: string;
//   image?: string;
//   description?: string;
//   platform?: string;
// }
//
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const validation = scrapeSchema.safeParse(body);
//     if (!validation.success) {
//       return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
//     }
//     const { url } = validation.data;
//     const platform = detectPlatform(url);
//     const oembedUrl = getOEmbedUrl(url, platform);
//     if (oembedUrl) {
//       try {
//         const res = await fetch(oembedUrl, {
//           headers: { "User-Agent": "CreatorBioTree/1.0" },
//           signal: AbortSignal.timeout(5000),
//         });
//         if (res.ok) {
//           const data = await res.json();
//           return NextResponse.json({
//             title: data.title || undefined,
//             image: data.thumbnail_url || undefined,
//             platform,
//           } as ScrapeResult);
//         }
//       } catch { /* fall through to OG tags */ }
//     }
//     try {
//       const res = await fetch(url, {
//         headers: { "User-Agent": "CreatorBioTree/1.0 (bot)" },
//         signal: AbortSignal.timeout(8000),
//       });
//       if (res.ok) {
//         const html = await res.text();
//         const og = extractOpenGraph(html, url);
//         return NextResponse.json({ ...og, platform } as ScrapeResult);
//       }
//     } catch { /* page fetch failed */ }
//     return NextResponse.json({ platform } as ScrapeResult);
//   } catch (err) {
//     console.error("[social/scrape]", err);
//     return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
//   }
// }
//
// function detectPlatform(url: string): string {
//   const host = new URL(url).hostname.replace("www.", "");
//   if (host.includes("instagram.com")) return "instagram";
//   if (host.includes("tiktok.com")) return "tiktok";
//   if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
//   if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
//   if (host.includes("spotify.com")) return "spotify";
//   if (host.includes("facebook.com") || host.includes("fb.com")) return "facebook";
//   if (host.includes("twitch.tv")) return "twitch";
//   if (host.includes("patreon.com")) return "patreon";
//   if (host.includes("amazon.com") || host.includes("amazon.")) return "amazon";
//   if (host.includes("linkedin.com")) return "linkedin";
//   if (host.includes("discord.com") || host.includes("discord.gg")) return "discord";
//   if (host.includes("snapchat.com")) return "snapchat";
//   return "website";
// }
//
// function getOEmbedUrl(url: string, platform: string): string | null {
//   const encoded = encodeURIComponent(url);
//   switch (platform) {
//     case "tiktok":
//       return `https://www.tiktok.com/oembed?url=${encoded}`;
//     case "youtube":
//       return `https://www.youtube.com/oembed?url=${encoded}&format=json`;
//     case "spotify":
//       return `https://embed.spotify.com/oembed?url=${encoded}`;
//     case "instagram":
//       return `https://graph.facebook.com/v12.0/instagram_oembed?url=${encoded}&access_token=${process.env.FACEBOOK_ACCESS_TOKEN ?? ""}`;
//     default:
//       return null;
//   }
// }
//
// function extractOpenGraph(html: string, baseUrl: string) {
//   ... (full implementation removed for brevity)
// }
