/**
 * limits.ts — upload size caps + billboard text caps in ONE place
 * (duplication audit 2026-09-29 #19). Client and server previously hardcoded
 * their own copies and disagreed: the billboard server silently truncated bio
 * (600) / media-kit (300) with no client counterpart. UI should show/enforce
 * these BEFORE the server slices them.
 */

/** Message attachment cap — must match `api/messages/upload` (8MB). */
export const MAX_MESSAGE_UPLOAD_BYTES = 8_000_000;

/** Creator file upload cap — must match `api/creator/upload` (50MB). */
export const MAX_AVATAR_UPLOAD_BYTES = 50 * 1024 * 1024;

/** My App PWA icon cap — must match `api/creator/my-app/icon` (2MB). */
export const MAX_APP_ICON_BYTES = 2_000_000;

/** Billboard text caps — client maxLength AND server `.slice()` both read these. */
export const BILLBOARD_LIMITS = {
  tagline: 60,
  bio: 600,
  mediaKit: 300,
  tags: 3,
} as const;
