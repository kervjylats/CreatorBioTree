/** Single source of truth for all domain types (row-shaped, camelCase JSONB keys). */
/**
 * src/types/index.ts
 *
 * Single source of truth for all domain types in BioTree.
 *
 * Rules:
 *  • Every shared type lives here — services, hooks, and routes import from this
 *    file. No type may be re-declared in a service file.
 *  • Table row types (Creator, ContentItem, Partnership …) mirror the exact
 *    column names that Supabase returns. JSONB columns (custom_theme)
 *    use camelCase keys because the DB stores them that way
 *    after migration 015 normalised all legacy snake_case keys.
 *  • Join-populated virtual fields (e.g. ContentItem.creators) are marked with
 *    an explicit JSDoc comment so they are never confused with stored columns.
 */

// ─── Plan ─────────────────────────────────────────────────────────────────────

/** Subscription tier for a creator account. */
export type Plan = "free" | "pro";

// ─── Theme primitives ─────────────────────────────────────────────────────────

export type FontStyle    = "sans" | "serif" | "mono";
export type ButtonStyle  = "rounded" | "sharp" | "pill" | "squircle" | "outline";
export type BorderRadius = "sm" | "md" | "lg" | "pill" | "2xl";

/** View IDs for the fan PWA phone preview in the playground. */
export type FanViewId = "guest" | "home" | "content" | "connect" | "settings";

/**
 * Design choices from the mini icon designer (2026-08-13, unified 2026-08-13):
 * a shared background (colour + optional gradient) plus ONE foreground —
 * a logo (upload, full-bleed), an emoji, or an initial. `source` says which
 * foreground was used, so the designer reopens with the same settings.
 */
export interface PlaygroundIconDesign {
  /** Which designer tool produced the icon. */
  source: "template" | "upload";
  /** Background colour (hex). */
  color: string;
  /** Optional second colour for a linear-gradient background. */
  gradientColor?: string | null;
  /** Glyph colour mode — "auto" picks contrast against the background. */
  glyphColor?: "auto" | "white" | "dark";
  emoji: string | null;
  letter: string | null;
  /** Original processed 512px PNG (data URL) — logo source only, for reopening. */
  sourceUrl?: string | null;
}

/**
 * Identity section of the fan-PWA theme, configured in the Playground.
 * These values drive what the installed app looks like on the fan's device.
 */
export interface PlaygroundProfile {
  /** PWA name shown on the fan's home-screen icon (optional — falls back to creators.display_name) */
  appName: string;
  /** Square app icon shown on the fan's phone (optional — falls back to creators.avatar_url) */
  appIconUrl: string;
  /** PWA status-bar colour override (playground.md Part 2a — defaults to the accent colour) */
  statusBarColor?: string | null;
  /** Design choices from the mini icon designer (2026-08-13) — regenerates the PNG icon. */
  iconDesign?: PlaygroundIconDesign | null;
}

/** Colour palette for the fan-PWA, configured in Playground. */
export interface PlaygroundColors {
  /** Main page background colour */
  background: string;
  /** Card / surface background colour */
  card: string;
  /** Primary text colour */
  text: string;
  /** Accent colour — buttons, links, and highlights */
  accent: string;
  /** Optional background image URL; overrides `background` when set */
  backgroundImage: string | null;
  /** CSS gradient string (e.g. "linear-gradient(135deg, #667eea, #764ba2)") */
  backgroundGradient?: string | null;
  /** Background opacity 0–1 (1 = fully opaque) */
  backgroundOpacity?: number;
  /** CSS blend mode for background layers */
  backgroundBlend?: string | null;
  /** Fill type: solid, gradient, or image */
  fillType?: "solid" | "gradient" | "image";
  /** Gradient type (when fillType is "gradient") */
  gradientType?: "linear" | "radial";
  /** Gradient angle in degrees (for linear) */
  gradientAngle?: number;
}

/** Complete fan-PWA theme, stored in `creators.custom_theme` as JSONB. */
export interface PlaygroundTheme {
  fontStyle:    FontStyle;
  buttonStyle:  ButtonStyle;
  /** Accent colour shortcut — mirrors `colors.accent` */
  accent:       string;
  borderRadius: BorderRadius;
  colors:       PlaygroundColors;
  profile:      PlaygroundProfile;
}

// ─── Creator ──────────────────────────────────────────────────────────────────

/** Payout provider the creator has configured. */
export type PayoutMethod = "stripe" | "paypal" | "bank_transfer";

/**
 * Full row type for the `creators` table.
 *
 * All columns are listed explicitly so TypeScript catches DB schema drift at
 * compile time. Columns that are not yet needed by the frontend are still
 * included with their correct types to prevent silent `any` slippage.
 */
export interface Creator {
  // ── Identity ────────────────────────────────────────────────────────────────
  id:           string;
  username:     string;
  display_name: string | null;
  bio:          string | null;
  avatar_url:   string | null;
  /** When display_name last actually CHANGED — starts its 7-day cooldown (settings.md Part 13). */
  display_name_changed_at: string | null;
  /** When avatar_url last actually CHANGED — its own independent 7-day cooldown (settings.md Part 13). */
  avatar_changed_at: string | null;
  /** When custom_theme.profile.appName last CHANGED — 7-day lock (playground.md Part 1e). */
  app_name_changed_at: string | null;
  /** When custom_theme.profile.appIconUrl last CHANGED — 7-day lock (playground.md Part 1e). */
  app_icon_changed_at: string | null;
  banner_url:   string | null;
  email:        string | null;
  role:         "creator" | "admin";
  country:      string | null;

  // ── Discovery & Categorisation ───────────────────────────────────────────
  /** PARKED 2026-10-09 (FB model, network.md §3): search is always on; no UI or
   *  logic reads this anymore. Kept for a future Settings "private mode". */
  show_in_search: boolean;
  /** Accept collab Connect-requests from other creators (default true; partners/request 403s when false). */
  open_to_collab: boolean;
  is_featured:     boolean;
  tags:            string[];
  niches:          string[];
  /** Short billboard headline (network.md — up to 60 chars). */
  tagline: string | null;
  /** How the creator likes to collab (network.md — freetext). */
  collab_style: string | null;
  /** Filterable discovery identity (network.md §1b — ONE preset bucket or null
   *  until set; never printed on cards; the free-text `tags` carry flavor). */
  primary_field: string | null;
  /** Empty-state text for the Connect tab (branding.md Part 9 #5). */
  connect_empty_text: string | null;
  /**
   * @deprecated Single-value niche column kept for data-migration compatibility.
   * Use `niches[]` for all new reads and writes.
   */
  niche:           string | null;
  metadata:        Record<string, unknown>;

  // ── Theme & Branding ─────────────────────────────────────────────────────
  theme_id:         string;
  custom_theme:     PlaygroundTheme | null;
  remove_branding:  boolean;
  push_notifications_enabled: boolean;
  social_links:     Record<string, string> | null;
  social_screenshots: Record<string, string>;
  ai_summary: string | null;

  // ── Domains ──────────────────────────────────────────────────────────────
  custom_domain:       string | null;
  preferred_subdomain: string | null;
  subdomain_active:    boolean;

  // ── Payments ─────────────────────────────────────────────────────────────
  plan:              Plan;
  stripe_account_id: string | null;
  /**
   * Stores the Paddle transaction ID from the webhook that created/upgraded
   * this creator account. The column name is a legacy holdover from a previous
   * Lemon Squeezy integration — it actually holds a Paddle event ID.
   */
  lemon_order_id:    string | null;
  payout_method:     PayoutMethod;
  payout_email:      string | null;
  payoneer_id:       string | null;
  paypal_email:      string | null;
  /** PayPal.me username (earnings.md §3) — what debtors' [Pay now] opens. Edited on the Earnings screen. */
  paypal_handle:     string | null;

  // ── Timestamps ────────────────────────────────────────────────────────────
  created_at: string;
  updated_at: string;
}

// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentType =
  | "link"
  | "audio"
  | "video"
  | "pdf"
  | "image"
  | "product"
  | "course"
  | "page"
  | "session"
  | "live"
  | "messaging"
  | "membership"
  | "physical"
  | "tip_jar"
  | "bundle"
  | "newsletter";

export type AccessType = "free" | "locked" | "paid";

// ─── Catalog primitives ──────────────────────────────────────────────────────

export type FileSubtype = "video" | "audio" | "image" | "document" | "other";

export type PricingModel =
  | "free"
  | "paid_one_time"
  | "pwyw"
  | "per_minute"
  | "per_message"
  | "recurring"
  | "tiered";

export type BillingCycle = "weekly" | "monthly" | "yearly";

export interface ProductVariant {
  name:    string;
  options: string[];
}

export interface BookingSlot {
  day:          number;  // 0 = Sunday … 6 = Saturday
  start:        string;  // "HH:mm"
  end:          string;  // "HH:mm"
  duration:     number;  // minutes
  max_bookings: number;
}

export interface ContentItemMetadata {
  /** Course lessons (populated when type === "course") */
  lessons?: Array<{
    id:    string;
    title: string;
    type:  "video" | "pdf" | "audio";
    url:   string;
  }>;
  /** Upload details (populated after file upload to R2 / Cloudflare Stream) */
  upload?: {
    uid:        string;
    is_stream:  boolean;
    filename?:  string;
    size?:      number;
    mimetype?:  string;
    thumbnail?: string;
  };
  /** Tip jar: suggested donation amounts */
  suggested_amounts?: number[];
  /** Tip jar: optional support message */
  support_message?: string;
  /** Bundle: IDs of items included in this bundle */
  item_ids?: string[];
  /** Newsletter: welcome message sent on signup */
  welcome_email?: string;
  /** Any item: optional ISO 8601 countdown expiry */
  countdown_ends_at?: string | null;
  /** Escape hatch for future metadata not yet modelled above */
  [key: string]: unknown;
}

export interface ContentItem {
  id:             string;
  creator_id:     string;
  type:             ContentType;
  subtype?:         FileSubtype | null;
  title:            string;
  description:      string | null;
  file_url:         string | null;
  thumbnail_url:    string | null;
  cover_image_url?: string | null;
  external_url:     string | null;
  platform?:        string | null;
  price:            number;
  currency:         string;
  access_type:      AccessType;
  pricing_model?:   PricingModel | null;
  billing_cycle?:   BillingCycle | null;
  is_published:   boolean;
  is_featured:    boolean;
  sort_order:     number;
  stock_quantity: number | null;
  is_physical:    boolean;
  affiliate_rate: number | null;
  /** Affiliate promotion enabled for this item (network.md §7). */
  affiliate_enabled: boolean;
  /**
   * How payment for this item is handled (playground.md Part 2c — founder decision
   * 2026-08-10): 'in_app' = PayPal checkout inside the fan app (default); 'external_link'
   * = "Buy" opens the creator's own URL (PayPal.me / Stripe Payment Link / Gumroad);
   * external-link items are EXCLUDED from affiliate deals (external-link quarantine).
   */
  payment_handling: "in_app" | "external_link" | null;
  /** Creator's own checkout URL when payment_handling === "external_link". */
  external_payment_url: string | null;
  /** ISO timestamp for scheduled publish (playground.md — link scheduling). */
  scheduled_publish_at: string | null;
  /** ISO timestamp for scheduled unpublish (playground.md — link scheduling). */
  scheduled_unpublish_at: string | null;
  variants:       ProductVariant[] | null;
  booking_slots:  BookingSlot[] | null;
  metadata:       ContentItemMetadata;
  /**
   * Populated ONLY when fetched with a creator join — not a stored column.
   * Use `content_items.creator_id` for ownership checks.
   */
  creators?: Pick<Creator, "id" | "username" | "display_name" | "stripe_account_id">;
  created_at: string;
  updated_at: string;
}

// ─── Theme (legacy preset system) ─────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  primary:    string;
  accent:     string;
  text:       string;
  card:       string;
}

export interface ThemeFonts {
  heading: string;
  body:    string;
}

export interface ThemeConfig {
  colors:       ThemeColors;
  fonts:        ThemeFonts;
  layout:       "stacked" | "grid";
  borderRadius: BorderRadius;
  buttonStyle:  ButtonStyle;
}

export interface Theme {
  id:     string;
  name:   string;
  config: ThemeConfig;
}

// ─── Fan ──────────────────────────────────────────────────────────────────────

export interface FanAccount {
  id:            string;
  email:         string;
  creator_id:    string;
  password_hash: string;
  referred_by:   string | null;
  last_seen_at:  string | null;
  do_not_contact: boolean;
  /** "Also send me updates?" consent captured at checkout (fan-shell.md decision #12) — the only email-updates bridge. */
  marketing_opt_in: boolean;
  notes:         string | null;
  created_at:    string;
}

export interface FanPurchase {
  id:                        string;
  fan_id:                    string;
  creator_id:                string;
  content_item_id:           string;
  amount_paid:               number;
  currency:                  string;
  stripe_payment_intent_id:  string | null;
  status:                    "pending" | "completed" | "refunded";
  purchased_at:              string;
}

export interface FanInstall {
  id:          string;
  creator_id:  string;
  fan_id:      string | null;
  platform:    "ios" | "android" | "desktop" | "unknown";
  installed_at: string;
}

// ─── Partnerships ─────────────────────────────────────────────────────────────

export type PartnershipStatus = "pending" | "active" | "declined" | "ended";

/** Where a connection was created — G18: one shared `partnerships` table, source flag records the entry point. */
export type PartnershipSource = "collab" | "invited";

/** A fan following a partner creator — persists across sessions (fan-shell.md Part 4c + partner-page.md). */
export interface FanFollow {
  id:                string;
  fan_id:            string;
  partner_id:        string;
  host_creator_id:   string;
  created_at:        string;
}

export interface Partnership {
  id:             string;
  creator_a:      string;
  creator_b:      string;
  status:         PartnershipStatus;
  source:         PartnershipSource;
  commission_pct: number;
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
  /**
   * Populated when fetched with a `creator_a` join.
   * Not a stored column.
   */
  creator_a_info?: Pick<Creator, "id" | "username" | "display_name" | "avatar_url">;
  /**
   * Populated when fetched with a `creator_b` join.
   * Not a stored column.
   */
  creator_b_info?: Pick<Creator, "id" | "username" | "display_name" | "avatar_url">;
}

export interface PartnerInvite {
  id:             string;
  from_creator_id: string;
  invite_code:    string;
  email:          string | null;
  used_by:        string | null;
  expires_at:     string;
  created_at:     string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PageView {
  id:              string;
  creator_id:      string;
  content_item_id: string | null;
  fan_id:          string | null;
  referrer:        string | null;
  viewed_at:       string;
}

// ─── Fan PWA page data ────────────────────────────────────────────────────────

export interface CreatorPage {
  creator: Creator;
  theme:   Theme;
  content: ContentItem[];
}

// ─── API response helpers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data:  T;
  error: null;
}

export interface ApiError {
  data:  null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Catalog: Course tables ──────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  course_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  created_at: string;
}

export interface PricingTier {
  name: string;
  price: number;
  description?: string | null;
}

// ─── Admin System (Option C: Full RBAC) ─────────────────────────────────────

export type AdminRole = "super_admin" | "support_admin" | "content_admin" | "agent";

export interface AdminAccount {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: Record<string, boolean>;
  api_key: string | null;
  created_at: string;
  updated_at: string;
}

/** Permission tiers mapped to roles — used by the permission-check helper. */
export const ADMIN_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin:   ["manage_admins", "view_all", "delete_platform_data", "manage_content", "manage_support", "api_access", "manage_service_access", "manage_disputes"],
  support_admin: ["view_creators", "view_fans", "impersonate", "manage_disputes"],
  content_admin: ["moderate_content", "flag_content", "approve_content", "reject_content"],
  agent:         ["api_access"],
};

// ─── Messaging (messaging.md — free WhatsApp-style messaging) ─────────────────────

export interface Conversation {
  id: string;
  creator_id: string | null;
  type: "direct" | "group";
  title: string | null;
  is_announcements_only: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_type: "creator" | "fan" | "partner";
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "creator" | "fan" | "partner";
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface MessageRequest {
  id: string;
  recipient_type: "creator" | "fan" | "partner";
  recipient_id: string;
  requester_type: "creator" | "fan" | "partner";
  requester_id: string;
  conversation_id: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_type: "creator" | "fan" | "partner";
  blocker_id: string;
  blocked_type: "creator" | "fan" | "partner";
  blocked_id: string;
  created_at: string;
}

export interface CommunityChannel {
  id: string;
  community_id: string;
  name: string;
  is_announcements_only: boolean;
  allowed_roles: string[];
  created_at: string;
}

// ─── Staff (staff.md — Model A: regular accounts granted roles) ────────────────

export interface StaffMember {
  id: string;
  creator_id: string;
  user_id: string;
  role: string;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface StaffInvite {
  id: string;
  creator_id: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  invite_code: string;
  used_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface StaffActivity {
  id: string;
  creator_id: string;
  member_id: string;
  action: string;
  details: string | null;
  created_at: string;
}

// ─── Affiliates (network.md §7 + monetization/creators.md Part 2) ────────────

export type AffiliateDealType = "percentage" | "fixed" | "free" | "tiered" | "custom";
export type AffiliateTrigger = "purchase" | "follow" | "subscribe" | "tip" | "signup" | "any";

/**
 * Column names and enum values match what the routes actually read and write
 * (2026-10-01 audit): `owner_id` / `promoter_id` / `custom_terms`,
 * deal_type "percentage", status active|paused|expired|revoked. Per-item scope
 * was REMOVED 2026-10-10 (creator-only deals, earnings.md §1 — zero ALTER since
 * the column never shipped to a real DB); `paused_reason` marks engine pauses.
 */
export interface AffiliateDeal {
  id: string;
  /** Creator who OWNS the catalog being promoted. */
  owner_id: string;
  /** Creator who PROMOTES the owner's catalog (the promoter). */
  promoter_id: string;
  trigger: AffiliateTrigger;
  deal_type: AffiliateDealType;
  /** Rate for percent deals (0-100), amount for fixed deals. No min/max validation per spec. */
  rate: number;
  custom_terms: string | null;
  status: "active" | "paused" | "expired" | "revoked";
  /** Engine-set when a Red Card pause flips this row (auto-restored when red clears). */
  paused_reason?: "owner_red" | null;
  /** Optional validity window accepted on deal create (deals/route.ts). */
  valid_from?: string | null;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateAttribution {
  id: string;
  /** The /ref/<code> token this click arrived on. */
  ref_code: string;
  deal_id: string;
  /** Backfilled at purchase time — anonymous at click (Part 2f). */
  fan_id: string | null;
  /** Set at purchase — the clicked item is unknown until then. */
  item_id: string | null;
  attributed_at: string;
}

/** Immutable settlement record (monetization/creators.md Part 2f). */
export interface AffiliateConversion {
  id: string;
  deal_id: string;
  /** fan_purchases.id — one conversion per sale per deal. */
  sale_id: string;
  owner_cut: number;
  promoter_cut: number;
  settle_method: "auto_split" | "manual" | null;
  settlement_status: "pending" | "awaiting_confirm" | "settled" | "disputed";
  /** 14-day window (earnings.md Part 4) — re-dated when the debtor marks paid. */
  due_at?: string | null;
  /** Receipt step 1 — debtor marked paid; promoter gets a 14-day confirm window. */
  owner_paid_at?: string | null;
  /** Receipt step 2 — promoter confirmed (or admin verdict set settled). */
  confirmed_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  /** Ladder bitmask — one bit per fired notice (lib/settlement.ts). */
  reminders_sent?: number | null;
  settled_at?: string | null;
  settled_manually?: boolean | null;
  distributed_at?: string | null;
  paypal_transfer_id?: string | null;
}

export interface AffiliateLink {
  id: string;
  deal_id: string;
  /** Creator who owns the link (the promoter) — real column name. */
  creator_id: string;
  /** The `/ref/<ref_code>` token — real column name (was `code`). */
  ref_code: string;
  click_count: number;
  active: boolean;
  created_at: string;
}

// ─── External Services (admin panel — service access dashboard) ──────────────

export type ServiceId =
  | "vercel"
  | "supabase"
  | "paypal"
  | "sentry"
  | "resend"
  | "posthog"
  | "onesignal";

export interface ExternalService {
  id: ServiceId;
  name: string;
  category: string;
  description: string;
  url: string;
}

export interface AdminServiceAccess {
  id: string;
  user_id: string;
  service_id: ServiceId;
  enabled: boolean;
  created_at: string;
}

// ─── Relationships (relationships.md — My Peeps) ─────────────────────────────

export interface FanProfile {
  fan: FanAccount;
  total_spent: number;
  last_purchase_at: string | null;
  install_count: number;
  purchase_count: number;
}
