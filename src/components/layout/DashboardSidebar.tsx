/**
 * DashboardSidebar — left-rail navigation for the creator desktop/tablet.
 * Renders 4 tab nav (Overview, Network, My App, Settings) + Admin Panel
 * for admin users. No sign out here — that lives in Settings.
 * Messages via floating ChatInboxPopover.
 *
 * On phones (<md), replaced by a bottom bar with the same 4 tabs.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Smartphone,
  Settings,
  Shield,
} from "lucide-react";

interface DashboardSidebarProps {
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  userEmail: string;
  isAdmin?: boolean;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/network", label: "Network", icon: Globe },
  { href: "/dashboard/my-app", label: "My App", icon: Smartphone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar({
  creator,
  userEmail,
  isAdmin = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard/overview"
      ? pathname === "/dashboard/overview" || pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleNavClick = () => onNavigate?.();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-4 py-5">
        <span className="flex items-center gap-2 text-lg font-bold text-foreground">
          🌳 CreatorBioTree
        </span>
      </div>

      {/* Creator identity */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {(creator.display_name || creator.username || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {creator.display_name || creator.username || "Creator"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{creator.username || "creator"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <Shield size={18} />
            Admin Panel
          </Link>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom bar — 4 tabs only */}
      <nav className="fixed inset-x-0 bottom-0 z-30 safe-bottom flex border-t border-border bg-card md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom spacing */}
      <div className="h-14 shrink-0 md:hidden" />
    </>
  );
}
