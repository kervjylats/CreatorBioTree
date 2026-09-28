/**
 * AdminClient — client-side admin dashboard with tabbed layout.
 * Auth guard calls GET /api/admin/accounts on mount; redirects to /dashboard
 * if the user is not an admin. Tab definitions live in nav-config.ts.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ADMIN_TABS } from "@/lib/nav-config";
import { StatsCards } from "@/components/admin/StatsCards";
import { CreatorsTable } from "@/components/admin/CreatorsTable";
import { AccountsTable } from "@/components/admin/AccountsTable";
import { AuditLog } from "@/components/admin/AuditLog";
import { ApiKeysPanel } from "@/components/admin/ApiKeysPanel";
import { ExternalServicesPanel } from "@/components/admin/ExternalServicesPanel";

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  overview: StatsCards,
  creators: CreatorsTable,
  accounts: AccountsTable,
  audit: AuditLog,
  "api-keys": ApiKeysPanel,
  services: ExternalServicesPanel,
};

export function AdminClient() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => {
        if (!r.ok) throw new Error("not admin");
        return r.json();
      })
      .then(() => setAuthorized(true))
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Admin</h1>
      <Tabs defaultValue={ADMIN_TABS[0]?.value}>
        <TabsList className="flex-wrap">
          {ADMIN_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {ADMIN_TABS.map((tab) => {
          const Component = TAB_COMPONENTS[tab.value];
          return Component ? (
            <TabsContent key={tab.value} value={tab.value}>
              <Component />
            </TabsContent>
          ) : null;
        })}
      </Tabs>
    </div>
  );
}
