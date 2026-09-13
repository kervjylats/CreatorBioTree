/**
 * GuestPageContent.tsx — the 3-layer guest fan page (fan-shell.md Part 2/3):
 * Header → Spotlight → Catalog Feed, plus the Follow gate (Layer 1b) and the
 * payment-success handoff (?payment=success&item=). In `editMode` (My App
 * preview) elements become selection targets for tap-to-edit popovers.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, Users } from "lucide-react";
import type { ContentItem } from "@/types";
import type { CreatorBranding } from "@/lib/branding";
import type { FanShellData } from "./fanData";
import { isScheduledVisible, money } from "./fanData";
import { CreatorHeader } from "./CreatorHeader";
import { FollowBox } from "./FollowBox";
import { ItemCard } from "./ItemCards";
import { FanAuthModal } from "./FanAuthModal";
import { GuestContactModal } from "@/components/chat/ChatShell";
import { buttonClass, cardRadius } from "./themeStyles";

export interface EditModeTarget {
  kind: "background" | "header" | "banner" | "avatar" | "bio" | "text" | "button" | "card" | "link" | "links";
  itemId?: string;
}

interface GuestPageContentProps {
  data: FanShellData;
  editMode?: boolean;
  onEdit?: (target: EditModeTarget) => void;
  showFollowGate?: boolean;
  hideHeader?: boolean;
}

export function GuestPageContent({ data, editMode, onEdit, showFollowGate = true, hideHeader }: GuestPageContentProps) {
  const searchParams = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    title: string;
    price: number;
    currency: string;
    email: string;
    optedIn: boolean;
  } | null>(null);

  const { branding } = data;

  const items: ContentItem[] = useMemo(
    () => (data.items ?? []).filter((item) => editMode || isScheduledVisible(item)),
    [data.items, editMode],
  );

  const spotlight = items.find((item) => item.is_featured);
  const feed = items.filter((item) => item.id !== spotlight?.id);
  const purchases = useMemo(() => new Set(data.purchases.map((p) => p.content_item_id)), [data.purchases]);

  // Mock PayPal handoff: /guest?payment=success&item=<id> → complete the
  // purchase client-side (the mock webhook lives in /api/fan/purchases/complete).
  useEffect(() => {
    const itemId = searchParams.get("item");
    if (searchParams.get("payment") !== "success" || !itemId) return;
    const pending = sessionStorage.getItem(`checkout_pending_${itemId}`);
    if (!pending) return;
    const { email, optIn } = JSON.parse(pending) as { email: string; optIn: boolean };
    sessionStorage.removeItem(`checkout_pending_${itemId}`);
    (async () => {
      const res = await fetch("/api/fan/purchases/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_item_id: itemId, fan_email: email, creator_id: data.branding.creatorId, opt_in_updates: optIn }),
      });
      const json = await res.json();
      if (res.ok) {
        const item = (data.items ?? []).find((i) => i.id === itemId);
        setConfirmed({
          title: item?.title ?? "your purchase",
          price: item?.price ?? 0,
          currency: (item?.currency ?? "USD").toUpperCase(),
          email,
          optedIn: optIn,
        });
        toast(optIn ? "Purchase recorded — thanks! Your receipt lands in Settings." : "Purchase recorded — thanks!");
        // Opted-in buyers get a session: reload so the server renders their
        // unlocked state. Non-opted-in buyers have no session — the inline
        // confirmation banner is their receipt (a purchase never auto-follows).
        if (optIn) window.location.reload();
      } else {
        toast(typeof json?.error === "string" ? json.error : "Couldn't record the purchase — contact the creator.");
        window.history.replaceState(null, "", window.location.pathname);
      }
    })();
  }, [searchParams, data.branding.creatorId, data.items]);

  const handleUnlock = async (_item: ContentItem, email: string) => {
    const res = await fetch("/api/fan/follow-creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, creator_username: data.username }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(typeof json?.error === "string" ? json.error : "Couldn't unlock — try again.");
      return;
    }
    toast("Unlocked — thanks for joining!");
    window.setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div
      className="min-h-full w-full"
      data-mock-edit-kind="background"
      style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
    >
      {/* Creator header — hidden in Content tab (hideHeader) where we only want catalog.
          Follow gate (Email/Follow/Contact) lives inline next to the avatar. */}
      {!hideHeader && (
        <CreatorHeader
          branding={branding}
          bio={data.bio}
          editMode={editMode}
          onEdit={onEdit}
          actions={
            showFollowGate ? (
              data.identity ? (
                <FollowBox creatorUsername={data.username} branding={branding} alreadyFollowing viewOnly inline />
              ) : (
                <>
                  <FollowBox creatorUsername={data.username} branding={branding} inline />
                  <button
                    type="button"
                    {...buttonClass(branding, "shrink-0 px-2 py-1 text-[11px]")}
                    onClick={() => setContactOpen(true)}
                  >
                    <MessageCircle size={10} /> Contact
                  </button>
                </>
              )
            ) : undefined
          }
        />
      )}

      {/* Community CTA — "Join the community" card (messaging.md Part 3 decision #9) */}
      {data.community && !data.identity && (
        <div className="px-4 pt-4">
          <div
            className={cardRadius(branding, "p-4 text-center")}
            style={{ backgroundColor: branding.cardColor }}
          >
            <Users size={24} className="mx-auto mb-2" style={{ color: branding.accentColor }} />
            <h3 className="text-sm font-bold" style={{ color: branding.textColor }}>
              Join the community
            </h3>
            <p className="mt-1 text-xs" style={{ color: branding.textColor + "88" }}>
              {data.community.name}
            </p>
            <button
              type="button"
              {...buttonClass(branding, "mt-3 w-full")}
              onClick={() => setAuthOpen(true)}
            >
              Sign up to join
            </button>
          </div>
        </div>
      )}

      {/* Purchase confirmation — inline receipt for mock buyers (no session, never auto-follows) */}
      {confirmed && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-green-300/70 bg-green-50 p-4 text-sm text-green-900">
            <p>
              <CheckCircle2 size={16} className="mr-1.5 inline" />
              <span className="font-bold">Purchase confirmed</span> — {confirmed.title} · {money(confirmed.price, confirmed.currency)}.
            </p>
            <p className="mt-1 opacity-90">
              A receipt is on its way to <span className="font-semibold">{confirmed.email}</span>
              {confirmed.optedIn ? ". Receipts also live in Settings." : " — in mock mode it's logged to the dev console."}
            </p>
          </div>
        </div>
      )}

      {/* Empty state — edit mode only, no items to show */}
      {editMode && items.length === 0 && (
        <div className="px-4 pt-8">
          <div
            className={cardRadius(branding, "p-6 text-center")}
            style={{
              backgroundColor: branding.cardColor,
              border: `2px dashed ${branding.textColor}22`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: branding.textColor + "88" }}>
              No items yet
            </p>
            <p className="mt-1 text-xs" style={{ color: branding.textColor + "66" }}>
              Add products, courses, or content in the Catalog tab.
            </p>
          </div>
        </div>
      )}

      {/* Spotlight */}
      {spotlight ? (
        <div className="px-4 pt-5" onClick={editMode ? () => onEdit?.({ kind: "card", itemId: spotlight.id }) : undefined}>
          <div className="overflow-hidden mb-1" style={{ backgroundColor: branding.cardColor }} data-mock-edit-kind="card">
            <ItemCard item={spotlight} identity={data.identity} purchases={purchases} branding={branding} onUnlock={handleUnlock} onAuthPrompt={() => setAuthOpen(true)} />
          </div>
        </div>
      ) : null}

      {/* Catalog feed */}
      {feed.length > 0 ? (
        <>
          <h2
            className="px-4 pt-5 pb-1 text-sm font-bold uppercase tracking-wide"
            style={{ color: branding.textColor + "99" }}
          >
            Catalog
          </h2>
          <div className="space-y-4 px-4 pb-24">
            {feed.map((item) => (
              <div key={item.id} data-mock-edit-kind="card" onClick={editMode ? () => onEdit?.({ kind: "card", itemId: item.id }) : undefined}>
                <ItemCard item={item} identity={data.identity} purchases={purchases} branding={branding} onUnlock={handleUnlock} onAuthPrompt={() => setAuthOpen(true)} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {authOpen && (
        <FanAuthModal
          creatorId={branding.creatorId}
          creatorUsername={data.username}
          branding={branding}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {contactOpen && (
        <GuestContactModal
          creatorId={branding.creatorId}
          creatorUsername={data.username}
          displayName={branding.displayName}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}