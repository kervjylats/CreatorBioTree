/**
 * services-config.ts — single source of truth for all external service
 * definitions. Used by the API route, admin panel, mock store, and dialog.
 */
import type { ExternalService, ServiceId } from "@/types";

/** Canonical list of all external service IDs. */
export const ALL_SERVICE_IDS: ServiceId[] = [
  "vercel",
  "supabase",
  "paypal",
  "sentry",
  "resend",
  "posthog",
  "onesignal",
];

/** Full service metadata — names, categories, descriptions, URLs. */
export const SERVICES: ExternalService[] = [
  { id: "vercel", name: "Vercel", category: "Hosting", description: "App hosting, deployments, CDN", url: "https://vercel.com/dashboard" },
  { id: "supabase", name: "Supabase", category: "Database", description: "Database, auth, storage, realtime", url: "https://supabase.com/dashboard" },
  { id: "paypal", name: "PayPal", category: "Payments", description: "Transactions, payouts, disputes", url: "https://www.paypal.com/business" },
  { id: "sentry", name: "Sentry", category: "Errors", description: "Error tracking, performance monitoring", url: "https://sentry.io" },
  { id: "resend", name: "Resend", category: "Email", description: "Transactional email delivery", url: "https://resend.com" },
  { id: "posthog", name: "PostHog", category: "Analytics", description: "User analytics, feature flags", url: "https://posthog.com" },
  { id: "onesignal", name: "OneSignal", category: "Push", description: "Push notifications", url: "https://onesignal.com" },
];

/** Service ID → display name map (for dialog/table headers). */
export const SERVICE_LABELS: Record<ServiceId, string> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s.name]),
) as Record<ServiceId, string>;

/** Service category → Tailwind color classes (admin panel cards). */
export const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  Hosting: "bg-emerald-100 text-emerald-700",
  Database: "bg-green-100 text-green-700",
  Payments: "bg-blue-100 text-blue-700",
  Errors: "bg-red-100 text-red-700",
  Email: "bg-purple-100 text-purple-700",
  Analytics: "bg-orange-100 text-orange-700",
  Push: "bg-cyan-100 text-cyan-700",
};
