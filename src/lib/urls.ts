/**
 * Global URL Utilities for CreatorBioTree
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for generating creator app links.
 * Automatically adds protocols and supports Vercel fallbacks.
 */

export function getCreatorPageUrl(username: string, customDomain?: string | null): string {
  if (customDomain) {
    return customDomain.startsWith("http") ? customDomain : `https://${customDomain}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/${username.toLowerCase().trim()}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://creator-bio-tree.vercel.app";

  return `${baseUrl}/${username.toLowerCase().trim()}`;
}

/** Build the URL for a partner's content page within a creator's app. */
export function getPartnerContentUrl(
  currentCreatorUsername: string,
  partnerUsername: string
): string {
  return `/${currentCreatorUsername}/partner/${partnerUsername}`;
}

/** Build the fan app URL for a creator (post-sign-up destination). */
export function getFanAppUrl(username: string): string {
  return `/${username}/app`;
}
