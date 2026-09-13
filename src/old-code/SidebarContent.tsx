/** TODO: Add purpose docstring. */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCreatorPageUrl } from "@/lib/urls";

interface SidebarContentProps {
  creator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  userEmail: string;
  isAdmin?: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}

// ─── Navigation items ─────────────────────────────────────────────────────────
// 4 tabs for creators. Admin gets a 5th tab automatically (see below).
// Content is nested inside Playground (/dashboard/playground/content) so
// the Playground tab stays active for both Design and Content sub-routes.

const NAV_ITEMS = [
  { href: "/dashboard",               label: "Overview",   icon: "◻" },
  { href: "/dashboard/playground", label: "Playground", icon: "🎨" },
  { href: "/dashboard/network",    label: "Network",    icon: "🌐" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export function SidebarContent({
  creator,
  userEmail,
  isAdmin = false,
  isActive,
  onNavigate,
}: SidebarContentProps) {
  const router = useRouter();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Warn about unsaved changes before navigating away
    if (typeof window !== "undefined" && (window as any).isFormDirty) {
      e.preventDefault();
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href") ?? "";
      window.dispatchEvent(new CustomEvent("trigger-unsaved-modal", { detail: href }));
    } else {
      onNavigate?.();
    }
  };

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-6">
        <span className="flex items-center gap-2 text-xl font-bold text-[#5A6A4A]">
          🌳 CreatorBioTree
        </span>
      </div>

      {/* ── Creator identity ───────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5A6A4A] text-sm font-bold text-[#FDFCF8]">
            {(creator.display_name ?? creator.username)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {creator.display_name ?? creator.username}
            </p>
            <p className="truncate text-xs text-gray-500">@{creator.username}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-[#F0EDE4] text-[#5A6A4A]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Admin-only tab — only visible to the platform owner */}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive("/dashboard/admin")
                ? "bg-[#F0EDE4] text-[#5A6A4A]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-base">🔐</span>
            Admin Panel
          </Link>
        )}
      </nav>

      {/* ── External links ─────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-3 py-1.5 space-y-0.5">
        <a
          href={getCreatorPageUrl(creator.username)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <span>↗</span>
          View my page
        </a>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <span>🌳</span>
          Visit CreatorBioTree
        </a>
      </div>

      {/* ── Footer: email + sign out ───────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-1">
        <p className="truncate px-3 text-xs text-gray-400">{userEmail}</p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
        >
          Sign out
        </button>
      </div>

    </div>
  );
}
