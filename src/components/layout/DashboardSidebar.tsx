/**
 * DashboardSidebar — left-rail navigation for the creator desktop/tablet.
 * Renders nav items from nav-config.ts (single source of truth).
 * Admin Panel appears for admin users on BOTH desktop sidebar and mobile bottom bar.
 * No sign out here — that lives in Settings.
 * Messages via floating MessageInboxPopover.
 *
 * On phones (<md), replaced by a bottom bar with the same items.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil } from "lucide-react";
import { getVisibleNavItems } from "@/lib/nav-config";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/shared/Avatar";
import { ProfileEditDialog } from "@/components/settings/ProfileEditDialog";

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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Earnings nav dot (earnings.md Part 5) — poll the cheap ?badge=1 branch on
  // mount + every 60s: action_required (overdue owed-to-me / confirms waiting)
  // or a red account lights the dot on the Earnings item.
  const [earningsAlert, setEarningsAlert] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = () => {
      fetch("/api/creator/affiliates/earnings?badge=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { action_required?: number; red_card?: boolean } | null) => {
          if (alive && d) setEarningsAlert((d.action_required ?? 0) > 0 || Boolean(d.red_card));
        })
        .catch(() => {});
    };
    check();
    const timer = setInterval(check, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // Overview is the dashboard ROOT ("/dashboard"), so it needs an exact match —
  // a plain startsWith("/dashboard") would light it up on every dashboard page.
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
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

      {/* Creator identity — photo now (was an initial letter); ✏️ = identity gateway
          #1 (settings.md Part 13) → ProfileEditDialog → Settings → Profile. Desktop
          only: the phone bottom bar has no identity block. */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={creator.avatar_url}
            name={creator.display_name || creator.username || "Creator"}
            size="h-9 w-9"
            textClass="text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {creator.display_name || creator.username || "Creator"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{creator.username || "creator"}
            </p>
          </div>
          <button
            type="button"
            title="Edit name & photo"
            aria-label="Edit name and photo"
            onClick={() => setProfileDialogOpen(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil size={14} />
          </button>
        </div>
        <ProfileEditDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
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
            {item.href === "/dashboard/earnings" && earningsAlert && (
              <span
                className="ml-auto h-2 w-2 shrink-0 rounded-full bg-red-500"
                aria-label="Action required"
              />
            )}
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
            {/* truncate: admin phones get 6 cells at 375px — labels elide, never wrap */}
            <span className="min-w-full truncate text-center">
              {item.label}
              {item.href === "/dashboard/earnings" && earningsAlert && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" aria-label="Action required" />
              )}
            </span>
          </Link>
          );
        })}
      </nav>

      {/* Mobile bottom spacing — main already reserves pb-20 on phones */}
    </>
  );
}
