/**
 * Content type metadata registry — defines the 16 catalog item types, their
 * pricing defaults, allowed pricing models, file subtypes, and capability flags.
 * Used by the My App catalog editor (AddItemPicker, ItemEditor, PricingEditor)
 * and the fan shell (ItemCards gate logic). The `editor` field was removed
 * (2026-08-11) — the generic ItemEditor handles all types.
 */
import type { ContentType, PricingModel, FileSubtype, BillingCycle, AccessType } from "./index";

export interface ContentTypeMeta {
  type: ContentType;
  label: string;
  description: string;
  icon: string;
  defaultPricing: PricingDefaults;
  allowedPricing: PricingModel[];
  fileSubtypes: FileSubtype[];
  metadataKeys: string[];
  supports: {
    file: boolean;
    externalUrl: boolean;
    platform: boolean;
    variants: boolean;
    stock: boolean;
    coverImage: boolean;
    countdown: boolean;
    course: boolean;
  };
}

export interface PricingDefaults {
  pricingModel: PricingModel;
  price?: number;
  billingCycle?: BillingCycle;
  pwywMinAmount?: number;
  perMinuteRate?: number;
  perMessageRate?: number;
  isPhysical?: boolean;
  stockQuantity?: number;
}

const BASE_PRICING: PricingModel[] = ["free", "paid_one_time", "pwyw", "tiered"];

export const CONTENT_TYPES: Record<ContentType, ContentTypeMeta> = {
  video: {
    type: "video",
    label: "Video",
    description: "MP4, MOV, or streaming video",
    icon: "🎬",
    defaultPricing: { pricingModel: "paid_one_time", price: 5 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: ["video"],
    metadataKeys: [],
    supports: { file: true, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  audio: {
    type: "audio",
    label: "Audio",
    description: "MP3, WAV, or podcast episode",
    icon: "🎵",
    defaultPricing: { pricingModel: "paid_one_time", price: 3 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: ["audio"],
    metadataKeys: [],
    supports: { file: true, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  image: {
    type: "image",
    label: "Image",
    description: "JPEG, PNG, or WebP image",
    icon: "🖼️",
    defaultPricing: { pricingModel: "free" },
    allowedPricing: BASE_PRICING,
    fileSubtypes: ["image"],
    metadataKeys: [],
    supports: { file: true, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  pdf: {
    type: "pdf",
    label: "PDF",
    description: "Document, ebook, or workbook",
    icon: "📄",
    defaultPricing: { pricingModel: "paid_one_time", price: 10 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: ["document"],
    metadataKeys: [],
    supports: { file: true, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  link: {
    type: "link",
    label: "Link",
    description: "External URL or affiliate link",
    icon: "🔗",
    defaultPricing: { pricingModel: "free" },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: true, platform: true, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  product: {
    type: "product",
    label: "Product",
    description: "Digital or hybrid product listing",
    icon: "🛍️",
    defaultPricing: { pricingModel: "paid_one_time", price: 15, isPhysical: true, stockQuantity: 10 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: false, variants: true, stock: true, coverImage: true, countdown: true, course: false },
  },
  course: {
    type: "course",
    label: "Course",
    description: "Multi-module course with lessons",
    icon: "📚",
    defaultPricing: { pricingModel: "paid_one_time", price: 49 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: true },
  },
  page: {
    type: "page",
    label: "Page",
    description: "Rich text / custom page",
    icon: "📝",
    defaultPricing: { pricingModel: "free" },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  session: {
    type: "session",
    label: "Session",
    description: "1:1 booking call",
    icon: "📅",
    defaultPricing: { pricingModel: "paid_one_time", price: 50, perMinuteRate: 2 },
    allowedPricing: [...BASE_PRICING, "per_minute"],
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  live: {
    type: "live",
    label: "Live",
    description: "Streaming event or webinar",
    icon: "📡",
    defaultPricing: { pricingModel: "paid_one_time", price: 10 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: true, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  messaging: {
    type: "messaging",
    label: "Messaging",
    description: "Paid DMs or Q&A",
    icon: "💬",
    defaultPricing: { pricingModel: "per_message", perMessageRate: 5 },
    allowedPricing: [...BASE_PRICING, "per_message"],
    fileSubtypes: [],
    metadataKeys: ["auto_response"],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  membership: {
    type: "membership",
    label: "Membership",
    description: "Recurring subscription tier",
    icon: "⭐",
    defaultPricing: { pricingModel: "recurring", price: 20, billingCycle: "monthly" },
    allowedPricing: [...BASE_PRICING, "recurring"],
    fileSubtypes: [],
    metadataKeys: ["benefits"],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  physical: {
    type: "physical",
    label: "Physical",
    description: "Shippable merchandise",
    icon: "📦",
    defaultPricing: { pricingModel: "paid_one_time", price: 25, isPhysical: true, stockQuantity: 10 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: [],
    supports: { file: false, externalUrl: false, platform: false, variants: true, stock: true, coverImage: true, countdown: true, course: false },
  },
  tip_jar: {
    type: "tip_jar",
    label: "Tip Jar",
    description: "One-tap donations with suggested amounts",
    icon: "☕",
    defaultPricing: { pricingModel: "pwyw", pwywMinAmount: 1 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: ["suggested_amounts", "support_message"],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  bundle: {
    type: "bundle",
    label: "Bundle",
    description: "Package multiple items at a discount",
    icon: "🎁",
    defaultPricing: { pricingModel: "paid_one_time", price: 25 },
    allowedPricing: BASE_PRICING,
    fileSubtypes: [],
    metadataKeys: ["item_ids"],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
  newsletter: {
    type: "newsletter",
    label: "Newsletter",
    description: "Free email list or paid subscription",
    icon: "📧",
    defaultPricing: { pricingModel: "recurring", price: 5, billingCycle: "monthly" },
    allowedPricing: [...BASE_PRICING, "recurring"],
    fileSubtypes: [],
    metadataKeys: ["welcome_email"],
    supports: { file: false, externalUrl: false, platform: false, variants: false, stock: false, coverImage: true, countdown: true, course: false },
  },
};

// ─── Shared enum arrays (for Zod schemas & iteration) ─────────────────────────

export const ACCESS_TYPE_VALUES: AccessType[] = ["free", "locked", "paid"];
export const PRICING_MODEL_VALUES: PricingModel[] = ["free", "paid_one_time", "pwyw", "per_minute", "per_message", "recurring", "tiered"];
export const BILLING_CYCLE_VALUES: BillingCycle[] = ["weekly", "monthly", "yearly"];
export const FILE_SUBTYPE_VALUES: FileSubtype[] = ["video", "audio", "image", "document", "other"];

export const TYPE_VALUES = Object.keys(CONTENT_TYPES) as unknown as [ContentType, ...ContentType[]];

export const TYPE_ICONS: Record<string, string> = {};
for (const key of TYPE_VALUES) {
  TYPE_ICONS[key] = CONTENT_TYPES[key].icon;
}

export const ITEM_TYPES: { type: ContentType; label: string; description: string; icon: string }[] =
  TYPE_VALUES.map((t) => ({
    type: t,
    label: CONTENT_TYPES[t].label,
    description: CONTENT_TYPES[t].description,
    icon: CONTENT_TYPES[t].icon,
  }));

export const DEFAULTS: Record<ContentType, PricingDefaults> = {} as Record<ContentType, PricingDefaults>;
for (const key of TYPE_VALUES) {
  (DEFAULTS as Record<string, PricingDefaults>)[key] = { ...CONTENT_TYPES[key].defaultPricing };
}
