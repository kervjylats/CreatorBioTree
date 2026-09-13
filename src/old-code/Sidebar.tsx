/** TODO: Add purpose docstring. */
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SidebarContent } from "./SidebarContent";

interface SidebarProps {
  creator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  userEmail: string;
  isAdmin?: boolean;
}

export function DashboardSidebar({ creator, userEmail, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <SidebarContent creator={creator} userEmail={userEmail} isAdmin={isAdmin} isActive={isActive} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <span className="text-sm font-semibold text-gray-900">
          {creator.display_name ?? creator.username}
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 bg-white shadow-xl">
            <div className="h-14 border-b border-gray-200" />
            <SidebarContent 
              creator={creator} 
              userEmail={userEmail} 
              isAdmin={isAdmin}
              isActive={isActive}
              onNavigate={() => setMobileOpen(false)} 
            />
          </aside>
        </div>
      )}

      {/* Mobile top spacing */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  );
}
