/**
 * PartnersPage — /dashboard/circle/partners content (network.md): pending
 * requests (incoming accept/decline + outgoing pending), active collabs list
 * with an in-page CollabDetail panel, and the shareable partner invite card.
 * Also consumes the ?joined= / ?invite_error= params from the logged-in invite
 * accept on /onboarding (partnership.md, 2026-10-07) as a one-shot toast.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollabList } from "@/components/circle/partners/CollabList";
import { CollabDetail } from "@/components/circle/partners/CollabDetail";
import { InboxRequests } from "@/components/circle/partners/InboxRequests";
import { PartnerInviteCard } from "@/components/circle/partners/PartnerInviteCard";

export function PartnersPage() {
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // One-shot invite-accept feedback (params stripped so a refresh doesn't re-toast).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joined = params.get("joined");
    const inviteError = params.get("invite_error");
    if (joined !== null) {
      toast.success(
        joined ? `You're now partnered with ${joined}` : "You're now partnered"
      );
      window.history.replaceState({}, "", window.location.pathname);
    } else if (inviteError !== null) {
      toast.error("Invite invalid or expired");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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