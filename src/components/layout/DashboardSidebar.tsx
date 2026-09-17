/**
 * DashboardSidebar — left-rail navigation for the creator desktop/tablet.
 * Renders 4 tab nav (Overview, Network, My App, Settings), persistent
 * actions (Install app, View page), Admin Panel for admin users, and sign-out.
 * Messages are accessed via the floating ChatInboxPopover — not here.
 *
 * On phones (<md), replaced by a bottom bar with 4 main tabs + More menu.
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  LayoutDashboard,
  Globe,
  Smartphone,
  Settings,
  Shield,
  Download,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  X,
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
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const { triggerInstall } = usePWAInstall({ creatorId: creator.id });

  const isActive = (href: string) =>
    href === "/dashboard/overview"
      ? pathname === "/dashboard/overview" || pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleNavClick = () => onNavigate?.();

  const handleSignOut = () => {
    document.cookie = "mock_auth_uid=; path=/; max-age=0";
    document.cookie = "mock_auth_email=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  };

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

      {/* Persistent actions */}
      <div className="space-y-0.5 border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={() => { triggerInstall(); onNavigate?.(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Download size={18} />
          Install my fan app
        </button>

        <a
          href={`/${creator.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <ExternalLink size={18} />
          View my page
        </a>
      </div>

      {/* Footer */}
      <div className="space-y-1 border-t border-border px-3 py-3">
        <p className="truncate px-3 text-xs text-muted-foreground">
          {userEmail}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom bar */}
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
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground"
        >
          <MoreHorizontal size={20} strokeWidth={2} />
          More
        </button>
      </nav>

      {/* More drawer overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-card shadow-2xl safe-bottom">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">More</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => { triggerInstall(); setMoreOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <Download size={18} />
                Install my fan app
              </button>
              <a
                href={`/${creator.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <ExternalLink size={18} />
                View my page
              </a>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => { handleNavClick(); setMoreOpen(false); }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  <Shield size={18} />
                  Admin Panel
                </Link>
              )}
              <div className="my-1 border-t border-border" />
              <p className="px-3 py-2 text-xs text-muted-foreground">{userEmail}</p>
              <button
                type="button"
                onClick={() => { handleSignOut(); setMoreOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom spacing */}
      <div className="h-16 shrink-0 md:hidden" />
    </>
  );
}
