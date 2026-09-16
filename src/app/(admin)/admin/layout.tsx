/**
 * Admin layout — auth guard + sidebar nav (same shell as creator dashboard).
 * Admin users see the sidebar at ≥md, bottom bar at <md.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";
import { ChatInboxPopover } from "@/components/chat/ChatShell";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
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
  if (!adminAccount) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        creator={creator}
        userEmail={user.email ?? ""}
        isAdmin={true}
      />
      <main className="min-h-screen flex-1">{children}</main>
      <ChatInboxPopover />
    </div>
  );
}
