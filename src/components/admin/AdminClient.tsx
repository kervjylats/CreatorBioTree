/**
 * AdminClient — client-side admin dashboard with tabbed layout.
 * Auth guard calls GET /api/admin/accounts on mount; redirects to /dashboard
 * if the user is not an admin. Tabs: Overview, Creators, Staff Accounts,
 * Audit Log, API Keys.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsCards } from "@/components/admin/StatsCards";
import { CreatorsTable } from "@/components/admin/CreatorsTable";
import { AccountsTable } from "@/components/admin/AccountsTable";
import { AuditLog } from "@/components/admin/AuditLog";
import { ApiKeysPanel } from "@/components/admin/ApiKeysPanel";

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Admin</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="accounts">Staff Accounts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <StatsCards />
        </TabsContent>
        <TabsContent value="creators">
          <CreatorsTable />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsTable />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
