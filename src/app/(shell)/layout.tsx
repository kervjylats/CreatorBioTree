/**
 * Shell layout — shared layout for dashboard + admin.
 * Auth guard + sidebar nav + the single floating dock stack (My Peeps + Messages).
 * The stack is the ONLY place dashboard floating-corner placement is defined —
 * MyPeeps and MessageInboxPopover are position-less children (no magic offsets).
 * Vertical order top→bottom: Partners · Fans · Staff · 💬 Messages.
 * Admin gate: if visiting /admin without admin access, redirect to /dashboard.
 * One layout = one place to maintain padding, sidebar, auth, bottom bar.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";
import { MessageInboxPopover } from "@/components/messages/MessagesShell";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MyPeeps } from "@/components/layout/MyPeeps";

export const metadata: Metadata = {
  manifest: "/dashboard-manifest.json",
};

export default async function ShellLayout({
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

  // Defense-in-depth admin gate (proxy.ts is the primary gate)
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";
  if (pathname.startsWith("/admin") && !adminAccount) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen-safe bg-background">
      <DashboardSidebar
        creator={creator}
        userEmail={user.email ?? ""}
        isAdmin={!!adminAccount}
      />
      <main className="min-h-screen-safe min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-center gap-2 md:bottom-6 md:right-6">
        <MyPeeps />
        <MessageInboxPopover />
      </div>
    </div>
  );
}
