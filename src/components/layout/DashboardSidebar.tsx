/**
 * DashboardSidebar — left-rail navigation for the creator desktop/tablet.
 * Renders nav items from nav-config.ts (single source of truth).
 * Admin Panel appears for admin users on BOTH desktop sidebar and mobile bottom bar.
 * No sign out here — that lives in Settings.
 * Messages via floating ChatInboxPopover.
 *
 * On phones (<md), replaced by a bottom bar with the same items.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVisibleNavItems } from "@/lib/nav-config";
import { Logo } from "@/components/shared/Logo";

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

export function DashboardSidebar({
  creator,
  userEmail,
  isAdmin = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems(isAdmin);

  const isActive = (href: string) =>
    href === "/dashboard/overview"
      ? pathname === "/dashboard/overview" || pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleNavClick = () => onNavigate?.();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-4 py-5">
        <Logo
          size={16}
          wordmark="CreatorBioTree"
          className="gap-2"
          wordmarkClassName="text-lg font-bold text-foreground"
        />
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

      {/* Navigation — same items on desktop sidebar and mobile bottom bar */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => (
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
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom bar — same items as desktop sidebar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 safe-bottom flex border-t border-border bg-card md:hidden">
        {navItems.map((item) => {
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

      {/* Mobile bottom spacing — main already reserves pb-20 on phones */}
    </>
  );
}
