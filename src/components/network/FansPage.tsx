/**
 * FansPage — /dashboard/network/fans content (network.md): full-width
 * FanListTable with filters/search/CSV plus the FanProfileDrawer slide-out.
 */
"use client";

import { useState } from "react";
import { FanListTable } from "@/components/relationships/FanListTable";
import { FanProfileDrawer } from "@/components/relationships/FanProfileDrawer";

export function FansPage() {
  const [selectedFanId, setSelectedFanId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Fans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone who follows, subscribes, or buys from you.
        </p>
      </div>

      <FanListTable
        onSelectFan={(fanId) => {
          setSelectedFanId(fanId);
          setDrawerOpen(true);
        }}
      />

      <FanProfileDrawer
        fanId={selectedFanId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}