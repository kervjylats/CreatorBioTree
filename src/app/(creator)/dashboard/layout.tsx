/**
 * Dashboard layout — auth guard + left sidebar nav + floating Messages inbox.
 * Sidebar renders 4 tabs (Overview, Network, My App, Settings) with Admin
 * Panel for admin users. Messages inbox stays as a floating popover.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";
import { ChatInboxPopover } from "@/components/chat/ChatShell";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  manifest: "/dashboard-manifest.json",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!creator) redirect("/onboarding");

  const adminAccount = await getAdminAccount(user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        creator={creator}
        userEmail={user.email ?? ""}
        isAdmin={!!adminAccount}
      />
      <main className="min-h-screen flex-1">{children}</main>
      <ChatInboxPopover />
    </div>
  );
}
