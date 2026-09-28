/**
 * PartnersPage — /dashboard/circle/partners content (network.md): pending
 * requests (incoming accept/decline + outgoing pending), active collabs list
 * with an in-page CollabDetail panel, and the shareable partner invite card.
 */
"use client";

import { useState } from "react";
import { CollabList } from "@/components/circle/partners/CollabList";
import { CollabDetail } from "@/components/circle/partners/CollabDetail";
import { InboxRequests } from "@/components/circle/partners/InboxRequests";
import { PartnerInviteCard } from "@/components/circle/partners/PartnerInviteCard";

export function PartnersPage() {
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Collab requests, active partnerships, and partner invites.
        </p>
      </div>

      <InboxRequests key={refreshKey} onAccepted={() => setRefreshKey((k) => k + 1)} />

      {selectedCollab ? (
        <CollabDetail
          partnershipId={selectedCollab}
          onBack={() => setSelectedCollab(null)}
        />
      ) : (
        <CollabList
          key={refreshKey}
          onSelect={setSelectedCollab}
          selectedId={selectedCollab}
        />
      )}

      <PartnerInviteCard />
    </div>
  );
}