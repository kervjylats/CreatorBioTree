/**
 * fanData.ts — shared data shapes + gate computation for the fan shell (fan-shell.md
 * Parts 1–3). One FanShellData object per request, resolved server-side in the
 * screens and passed to every presentation component. The Three Gates (Part 2)
 * are computed here so guest page + Content tab + My App preview all agree.
 */
import type { CreatorBranding } from "@/lib/branding";
import type { ContentItem, FanPurchase } from "@/types";

/** Who the fan_session cookie identifies (if anyone). */
export interface FanIdentity {
  fanId: string;
  email: string;
  /** password_hash set → Fan (4-tab app); null → Follower (personalized guest page only). */
  hasPassword: boolean;
}

export interface FanShellData {
  branding: CreatorBranding;
  /** Link Address / username (for URLs + API calls). */
  username: string;
  /** Creator bio (artists row — shown under the display name in the header). */
  bio: string | null;
  /** Published items (scheduled filters applied server-side). */
  items: ContentItem[];
  /** Session identity — null when the visitor is unknown. */
  identity: FanIdentity | null;
  /** Completed purchases for the session email (fan + follower + guest-buyer rows). */
  purchases: FanPurchase[];
  /** Creator's custom Connect-tab empty text (falls back to platform default). */
  connectEmptyText: string;
  /** Artist links for the Connect tab (derived from social_links; Connect-only, fan-shell.md Part 4c). */
  artistLinks: { label: string; url: string }[];
  /** Creator's community (messaging.md Part 3). Null when the creator has no community. */
  community: {
    id: string;
    name: string;
    icon: string | null;
    join_rule: string;
    /** Whether the current fan is a member of any channel in this community. */
    isMember: boolean;
    /** Accessible channels (restricted channels only included when the fan has the right role). */
    channels: {
      id: string;
      title: string;
      announcements_only: boolean;
      restricted: boolean;
      myRole: string | null;
    }[];
  } | null;
}

/** The Three Gates (fan-shell.md Part 2) — one state per item per visitor. */
export type ItemGateState = "free" | "email-gated" | "paid" | "member" | "purchased";

export interface ItemGate {
  state: ItemGateState;
  /** Button label shown on the card (e.g. "Buy — $9", "Sign up to unlock"). */
  cta: string;
  /** For external-link items (payment_handling === 'external_link') — the rail is invisible to fans. */
  externalUrl: string | null;
}

/** True when the item passes the link-scheduling window (my-app.md Part 2c). */
export function isScheduledVisible(item: ContentItem, now = new Date()): boolean {
  const t = now.getTime();
  if (item.scheduled_publish_at && new Date(item.scheduled_publish_at).getTime() > t) return false;
  if (item.scheduled_unpublish_at && new Date(item.scheduled_unpublish_at).getTime() <= t) return false;
  return true;
}

function formatMoney(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

/**
 * The Three Gates (fan-shell.md Part 2). `identity` = fan_session recognition;
 * `purchasedItemIds` = content ids with completed purchases under the session email.
 * A purchase NEVER auto-follows — purchase rows are keyed by email, not by session.
 */
export function computeItemGate(
  item: ContentItem,
  identity: FanIdentity | null,
  purchasedItemIds: Set<string>,
): ItemGate {
  const isPaid = item.pricing_model !== "free" && (item.price ?? 0) > 0 && item.access_type === "paid";
  const isMember = item.pricing_model === "recurring" && item.type === "membership";
  const isEmailGated = item.access_type === "locked";

  const external: string | null =
    item.payment_handling === "external_link" && item.external_payment_url ? item.external_payment_url : null;

  if (isPaid && purchasedItemIds.has(item.id)) return { state: "purchased", cta: "Purchased ✓", externalUrl: null };
  if (isMember) return { state: "member", cta: "Join membership", externalUrl: external };
  if (isPaid) return { state: "paid", cta: `Buy — ${formatMoney(item.price, item.currency)}`, externalUrl: external };
  if (isEmailGated) {
    if (identity) return { state: "free", cta: "Unlocked ✓", externalUrl: null };
    return { state: "email-gated", cta: "Sign up to unlock", externalUrl: null };
  }
  return { state: "free", cta: item.type === "newsletter" ? "Subscribe" : "Open", externalUrl: external };
}

/** Money formatter shared by cards (e.g. "$9.00"). */
export function money(price: number, currency: string): string {
  return formatMoney(price, currency);
}