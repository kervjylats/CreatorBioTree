/**
 * limits.ts — upload size caps + billboard text caps in ONE place
 * (duplication audit 2026-09-29 #19). Client and server previously hardcoded
 * their own copies and disagreed: the billboard server silently truncated bio
 * (600) / media-kit (300) with no client counterpart. UI should show/enforce
 * these BEFORE the server slices them.
 */

/** Message attachment cap — must match `api/messages/upload` (8MB). */
export const MAX_MESSAGE_UPLOAD_BYTES = 8_000_000;

/**
 * The same cap expressed as a request-body limit, because the upload route reads
 * the base64 payload out of a JSON body: base64 inflates bytes by ~4/3. The route
 * used to hardcode 12,000,000 next to the 8,000,000 constant it derives from.
 */
export const MAX_MESSAGE_UPLOAD_B64_BYTES = Math.ceil((MAX_MESSAGE_UPLOAD_BYTES * 4) / 3);

/** Human-readable form of a byte cap, for client-side error copy. */
export function formatByteLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

/** Creator file upload cap — must match `api/creator/upload` (50MB). */
export const MAX_AVATAR_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Playground PWA icon cap — must match `api/creator/playground/icon` (2MB). */
export const MAX_APP_ICON_BYTES = 2_000_000;

/** Shareable invite links (staff + partners) live for 7 days. */
export const INVITE_TTL_DAYS = 7;

/** The matching expiry timestamp for a newly created invite link. */
export function inviteExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** Billboard text caps — client maxLength AND server `.slice()` both read these. */
export const BILLBOARD_LIMITS = {
  tagline: 60,
  bio: 600,
  mediaKit: 300,
  tags: 3,
} as const;
