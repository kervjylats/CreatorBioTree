/**
 * nav-config.ts — single source of truth for all navigation in the app.
 * Dashboard nav, fan tabs, admin tabs — all defined here.
 * Every component that renders navigation imports from this file.
 */
import {
  LayoutDashboard,
  Globe,
  Smartphone,
  Settings,
  Shield,
  Home,
  Package,
  Users,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { FanViewId } from "@/types";

/** Guest tab accent color (red) — distinct from creator branding. */
export const GUEST_TAB_COLOR = "#EF4444";

// ─── Fan tabs ────────────────────────────────────────────────────────────────

export interface FanTab {
  id: FanViewId;
  label: string;
  icon: LucideIcon;
}

/** All 5 fan tabs including Guest (for preview mode). */
export const FAN_TABS: FanTab[] = [
  { id: "guest", label: "Guest", icon: Eye },
  { id: "home", label: "Home", icon: Home },
  { id: "content", label: "Content", icon: Package },
  { id: "connect", label: "Connect", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

/** The 4 authenticated fan tabs (excludes Guest). */
export const AUTHENTICATED_FAN_TABS: FanTab[] = FAN_TABS.filter(
  (t) => t.id !== "guest",
);

/** Fan tab ID list for validation (MyAppForm). */
export const FAN_TAB_IDS = FAN_TABS.map((t) => t.id);

/** Reverse map: URL path segment → FanViewId (for FanAppShell). */
export const FAN_TAB_BY_PATH: Record<string, FanViewId> = Object.fromEntries(
  AUTHENTICATED_FAN_TABS.map((t) => [`/${t.id}`, t.id]),
);

// ─── Dashboard nav ───────────────────────────────────────────────────────────

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/network", label: "Network", icon: Globe },
  { href: "/dashboard/my-app", label: "My App", icon: Smartphone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin Panel", icon: Shield, adminOnly: true },
];

/** Filter nav items by role. */
export function getVisibleNavItems(isAdmin: boolean): DashboardNavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

// ─── Admin panel tabs ────────────────────────────────────────────────────────

export interface AdminTab {
  value: string;
  label: string;
}

export const ADMIN_TABS: AdminTab[] = [
  { value: "overview", label: "Overview" },
  { value: "creators", label: "Creators" },
  { value: "accounts", label: "Admins" },
  { value: "audit", label: "Audit Log" },
  { value: "api-keys", label: "API Keys" },
  { value: "services", label: "Services" },
];
