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

/**
 * Identity cooldown (settings.md Part 13, founder decision 2026-10-09): display
 * name + avatar each lock for this many days after a REAL change (identical-value
 * saves never lock). One constant — the server's 409 retry_at and the client's
 * lock-state math both derive from it.
 */
export const IDENTITY_COOLDOWN_DAYS = 7;

/** The matching unlock timestamp for an identity change made at `from`. */
export function identityUnlock(from: Date): string {
  return new Date(from.getTime() + IDENTITY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** Billboard text caps — client maxLength AND server `.slice()` both read these. */
export const BILLBOARD_LIMITS = {
  tagline: 60,
  bio: 600,
  mediaKit: 300,
  tags: 3,
} as const;

/** Primary-field buckets (network.md §1b, founder 2026-10-13 — the filterable
 *  discovery identity, ONE per creator, nullable until set). Locked list:
 *  additions are a future founder decision. Server validates PUTs against this;
 *  the Discover chip row renders it. */
export const PRIMARY_FIELD_BUCKETS = [
  "Music",
  "Wellness",
  "Fitness",
  "Comedy",
  "Food & Drink",
  "Fashion & Beauty",
  "Gaming",
  "Education",
  "Business & Finance",
  "Travel",
  "Photography",
  "Art & Design",
  "Film & Video",
  "Sports",
  "Parenting & Family",
  "Pets & Animals",
  "Tech",
  "Books & Writing",
  "Spirituality",
  "Lifestyle",
] as const;

/**
 * Settlement window (earnings.md Parts 4-5, founder decision 2026-10-10): a
 * creator-to-creator affiliate payment is due 14 days after the conversion is
 * written — the same number drives the Red Card threshold, the reminder ladder
 * (T0/T+3/T+7/T+14), and the mark-paid → promoter-confirm window.
 */
export const SETTLEMENT_DUE_DAYS = 14;

/** The matching due timestamp for a conversion created (or re-dated) at `from`. */
export function settlementDue(from: Date = new Date()): string {
  return new Date(from.getTime() + SETTLEMENT_DUE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
