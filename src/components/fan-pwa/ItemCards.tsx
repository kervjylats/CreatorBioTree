/**
 * ItemCards.tsx — per-type catalog cards + the Three Gates (fan-shell.md Part 2,
 * playground.md Part 3). One `ItemCard` per catalog item, gate-aware. Also hosts
 * CheckoutModal (email-only PayPal-style mock checkout) + NewsletterInline.
 */
"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Download, Lock, MessageCircle, Package, Play, Radio } from "lucide-react";
import { toast } from "sonner";
import type { ContentItem } from "@/types";
import type { CreatorBranding } from "@/lib/branding";
import { TYPE_ICONS } from "@/types/contentTypes";
import { MessageIcon } from "@/components/messages/MessagesShell";
import type { FanIdentity, ItemGate } from "./fanData";
import { computeItemGate } from "./fanData";
import { money, formatDateTime, DAY_LABELS } from "@/lib/format";
import { Sheet } from "@/components/shared/Sheet";
import { buttonClass, buttonShape, cardRadius, contrastText } from "./themeStyles";

// ─── Gate-aware card ─────────────────────────────────────────────────────────

interface ItemCardProps {
  item: ContentItem;
  identity: FanIdentity | null;
  purchases: Set<string>;
  branding: CreatorBranding;
  onUnlock: (item: ContentItem, email: string) => void;
  onAuthPrompt: () => void;
}

/** Open an external link safely — no-ops when the URL is null (external links are optional). */
function openUrl(url: string | null | undefined): void {
  if (url) window.open(url, "_blank", "noopener");
}

/** One catalog card — preview for paid/locked items, full card for owned/free. */
export function ItemCard({ item, identity, purchases, branding, onUnlock, onAuthPrompt }: ItemCardProps) {
  const gate: ItemGate = computeItemGate(item, identity, purchases);
  const [unlockEmail, setUnlockEmail] = useState("");
  const [showUnlockBox, setShowUnlockBox] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const accent = branding.accentColor;

  const cover = item.cover_image_url ?? item.thumbnail_url;
  const purchasedOrFree = gate.state === "purchased" || gate.state === "free";
  const lessons = (item.metadata?.lessons as ContentItem["metadata"]["lessons"]) ?? [];
  const slots = item.booking_slots ?? [];
  const bundleCount = (item.metadata?.item_ids as string[] | undefined)?.length ?? 0;

  const handleGateAction = () => {
    if (gate.state === "paid") {
      if (gate.externalUrl) {
        openUrl(gate.externalUrl);
        return;
      }
      setShowCheckout(true);
      return;
    }
    if (gate.state === "email-gated") {
      setShowUnlockBox(true);
      return;
    }
    if (gate.state === "member") {
      if (gate.externalUrl) {
        openUrl(gate.externalUrl);
        return;
      }
      setShowCheckout(true);
      return;
    }
    if (gate.state === "free" || gate.state === "purchased") {
      if (item.external_url) {
        openUrl(item.external_url);
        return;
      }
      setExpanded((v) => !v);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockEmail.trim()) return;
    onUnlock(item, unlockEmail.trim().toLowerCase());
  };

  return (
    <article data-tl="ItemCards" className={`overflow-hidden ${cardRadius(branding)}`} style={{ backgroundColor: branding.cardColor }}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div
          className="flex h-32 w-full items-center justify-center text-3xl"
          style={{ backgroundColor: accent + "22" }}
        >
          {TYPE_ICONS[item.type]}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm" style={{ color: branding.textColor + "88" }}>
              {TYPE_ICONS[item.type]} {item.type}
              {item.is_featured ? " · featured" : ""}
            </div>
            <h3 className="break-words font-bold leading-snug" style={{ color: branding.textColor }}>
              {item.title}
            </h3>
          </div>
          {gate.state === "purchased" && <CheckCircle2 className="shrink-0" size={20} color={accent} />}
          {gate.state === "member" && <Lock className="shrink-0" size={18} style={{ color: branding.textColor + "66" }} />}
        </div>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm" style={{ color: branding.textColor + "BB" }}>
            {item.description}
          </p>
        ) : null}

        {/* Item-type interaction row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.type === "link" && (
            <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.external_url)}>
              Visit <ArrowUpRight size={14} />
            </button>
          )}
          {item.type === "video" && purchasedOrFree && (
            <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.file_url)}>
              <Play size={14} /> Play preview
            </button>
          )}
          {item.type === "image" && purchasedOrFree && (
            <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.file_url)}>
              View full image
            </button>
          )}
          {item.type === "audio" && item.file_url && purchasedOrFree && (
            <audio controls src={item.file_url} className="h-9 w-full max-w-[220px] rounded-lg" />
          )}
          {item.type === "pdf" && item.file_url && purchasedOrFree && (
            <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.file_url)}>
              <Download size={14} /> Download
            </button>
          )}
          {/* Media types above stay hidden until the Three Gates open (fan-shell.md
              Part 2): a paid video/pdf must never expose file_url in the DOM. */}
          {item.type === "newsletter" && <NewsletterInline item={item} branding={branding} onUnlock={onUnlock} />}
          {item.type === "messaging" &&
            (identity ? (
              <MessageIcon otherKey={branding.creatorId} otherParty="creator" name={branding.displayName} accentColor={branding.accentColor} />
            ) : (
              <button type="button" {...buttonClass(branding)} onClick={() => setShowUnlockBox(true)}>
                <MessageCircle size={14} /> Message
              </button>
            ))}
          {item.type === "tip_jar" && <TipJarInline item={item} branding={branding} />}
          {item.type === "live" && (
            <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.external_url)}>
              <Radio size={14} /> Join live
            </button>
          )}
          {item.type === "page" && (
            <button type="button" {...buttonClass(branding)} onClick={() => setExpanded(true)}>
              Read page
            </button>
          )}
          {item.type === "course" && (
            <button type="button" {...buttonClass(branding)} onClick={() => setExpanded((v) => !v)}>
              <BookOpen size={14} /> Course ({lessons.length} lessons)
            </button>
          )}
          {item.type === "session" && !(gate.state === "paid" || gate.state === "member") && (
            <button type="button" {...buttonClass(branding)} onClick={() => setExpanded((v) => !v)}>
              <CalendarDays size={14} /> View slots
            </button>
          )}
          {item.type === "bundle" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: branding.textColor + "88" }}>
              <Package size={14} /> Bundle · {bundleCount} items
            </span>
          )}
          {(item.type === "physical" || item.type === "product") && (item.variants?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.variants!.map((v) => (
                <span
                  key={v.name}
                  className={`${buttonShape(branding)} px-2.5 py-0.5 text-caption font-semibold`}
                  style={{ backgroundColor: accent + "22", color: branding.accentColor }}
                >
                  {v.name}: {v.options.join(" / ")}
                </span>
              ))}
            </div>
          )}
          {(item.type === "physical" || item.type === "product") && item.stock_quantity != null && (
            <span className="text-xs" style={{ color: branding.textColor + "88" }}>
              {item.stock_quantity === 0 ? "Out of stock" : `${item.stock_quantity} in stock`}
            </span>
          )}
          {item.type === "live" && item.scheduled_publish_at && (
            <span className="text-xs" style={{ color: branding.textColor + "88" }}>
              Starts {formatDateTime(item.scheduled_publish_at)}
            </span>
          )}
        </div>

        {/* The gate CTA (single button per card, per the Three Gates) */}
        {!purchasedOrFree && gate.state !== "email-gated" ? (
          <button type="button" {...buttonClass(branding, "mt-3 w-full")} onClick={handleGateAction}>
            {gate.cta}
          </button>
        ) : null}

        {gate.state === "email-gated" && !showUnlockBox && (
          <button type="button" {...buttonClass(branding, "mt-3 w-full")} onClick={handleGateAction}>
            {gate.cta}
          </button>
        )}

        {showUnlockBox && (
          <form onSubmit={handleUnlockSubmit} className="mt-3 space-y-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={unlockEmail}
              onChange={(e) => setUnlockEmail(e.target.value)}
              className={cardRadius(branding, "w-full border px-3 py-2 text-sm outline-none")}
              style={{ borderColor: branding.textColor + "33", color: branding.textColor }}
            />
            <button type="submit" {...buttonClass(branding, "w-full")}>
              Unlock with email
            </button>
          </form>
        )}

        {expanded && (
          <div className="mt-3 space-y-2 text-sm" style={{ color: branding.textColor + "BB" }}>
            {item.description && (item.type === "page" ? null : <p>{item.description}</p>)}
            {item.type === "page" && (item.metadata?.body as string | undefined) && (
              <div className="whitespace-pre-wrap">{item.metadata.body as string}</div>
            )}
            {item.type === "membership" &&
              Array.isArray(item.metadata?.benefits) &&
              (item.metadata.benefits as string[]).length > 0 && (
                <ul className="list-disc space-y-1 pl-4">
                  {(item.metadata.benefits as string[]).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            {item.type === "course" && lessons.length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {lessons.map((lesson, idx) => {
                  const unlocked = gate.state === "purchased" || gate.state === "free";
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                      style={{ backgroundColor: branding.backgroundColor }}
                    >
                      <span className="text-xs font-bold" style={{ color: branding.accentColor }}>
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                      {unlocked && lesson.url ? (
                        <button type="button" {...buttonClass(branding, "shrink-0 !px-2.5 !py-1 text-xs")} onClick={() => openUrl(lesson.url)}>
                          <Play size={12} /> Play
                        </button>
                      ) : (
                        <Lock size={12} style={{ color: branding.textColor + "66" }} />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {item.type === "session" && slots.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {slots.map((slot, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                    style={{ backgroundColor: branding.backgroundColor }}
                  >
                    <CalendarDays size={13} style={{ color: branding.accentColor }} />
                    <span className="font-semibold">{DAY_LABELS[slot.day]}</span>
                    {slot.start}–{slot.end} · {slot.duration} min · {slot.max_bookings} booking
                    {slot.max_bookings > 1 ? "s" : ""}
                  </li>
                ))}
              </ul>
            )}
            {gate.state === "purchased" && item.file_url && (
              <button type="button" {...buttonClass(branding)} onClick={() => openUrl(item.file_url)}>
                <Download size={14} /> Open your purchase
              </button>
            )}
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          item={item}
          branding={branding}
          defaultEmail={identity?.email ?? ""}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </article>
  );
}

// ─── Newsletter inline subscribe ──────────────────────────────────────────────

function NewsletterInline({
  item,
  branding,
  onUnlock,
}: {
  item: ContentItem;
  branding: CreatorBranding;
  onUnlock: (item: ContentItem, email: string) => void;
}) {
  const [email, setEmail] = useState("");
  return (
    <form
      className="flex w-full max-w-[240px] items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) onUnlock(item, email.trim().toLowerCase());
      }}
    >
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cardRadius(branding, "min-w-0 flex-1 border px-2.5 py-1.5 text-sm outline-none")}
        style={{ borderColor: branding.textColor + "33", color: branding.textColor }}
      />
      <button type="submit" {...buttonClass(branding, "shrink-0")}>
        Subscribe
      </button>
    </form>
  );
}

// ─── Tip jar inline ───────────────────────────────────────────────────────────

/**
 * Tip jar inline — HONEST DISABLED STATE (2026-10-01 audit).
 *
 * This used to collect the email, write a Follower row and toast "Unlocked —
 * thanks for joining!" for a chosen amount: no money moved, no `fan_purchases`
 * row was written, and the $5/$10/$25 chips were pure decoration. A tip button
 * that pretends to take money is the worst kind of lie, so the control now says
 * plainly that tipping isn't switched on yet (founder policy: label honestly,
 * never fake a success).
 *
 * To wire it for real: send the chosen amount through POST /api/paypal/checkout
 * (the same rail the paid items use) and record the tip as a purchase.
 */
function TipJarInline({
  item,
  branding,
}: {
  item: ContentItem;
  branding: CreatorBranding;
}) {
  const amounts: number[] =
    Array.isArray(item.metadata?.suggested_amounts) && (item.metadata?.suggested_amounts as number[]).length
      ? (item.metadata?.suggested_amounts as number[])
      : [5, 10, 25];

  return (
    <div className="flex w-full flex-col gap-2">
      {(item.metadata?.support_message as string | undefined) ? (
        <p className="text-xs" style={{ color: branding.textColor + "AA" }}>
          {item.metadata.support_message as string}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        {amounts.map((a) => (
          <span
            key={a}
            className={`${buttonShape(branding)} min-h-11 px-4 text-xs font-semibold opacity-50`}
            style={{
              backgroundColor: branding.accentColor + "22",
              color: branding.accentColor,
            }}
          >
            {money(a, item.currency)}
          </span>
        ))}
        <span className="text-xs" style={{ color: branding.textColor + "99" }}>
          Tipping isn&apos;t switched on yet
        </span>
      </div>
    </div>
  );
}

// ─── Checkout (email-only; mock PayPal) ───────────────────────────────────────

interface CheckoutModalProps {
  item: ContentItem;
  branding: CreatorBranding;
  defaultEmail: string;
  onClose: () => void;
}

/** Guest checkout — email only, no account (fan-shell.md Part 1 Layer 1). "Also send me updates?" defaults OFF — a purchase NEVER auto-follows. */
export function CheckoutModal({ item, branding, defaultEmail, onClose }: CheckoutModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/paypal/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_item_id: item.id,
          fan_email: email.trim().toLowerCase(),
          creator_id: branding.creatorId,
          opt_in_updates: optIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Checkout failed. Try again.");
        return;
      }
      // Stash the pending completion (mock webhook equivalent) so the success
      // page can record the purchase when we bounce back with ?payment=success.
      sessionStorage.setItem(
        `checkout_pending_${item.id}`,
        JSON.stringify({ email: email.trim().toLowerCase(), optIn }),
      );
      window.location.assign(data.url);
    } catch {
      setError("Checkout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div
        className={cardRadius(branding, "w-full max-w-md p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl")}
        style={{ backgroundColor: branding.cardColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="break-words text-lg font-bold" style={{ color: branding.textColor }}>
          Buy — {item.title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: branding.textColor + "77" }}>
          {money(item.price, item.currency)} · no account needed — your email unlocks everything
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            placeholder="Email (this is your access key)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cardRadius(branding, "w-full border px-3 py-2 text-sm outline-none")}
            style={{
              borderColor: branding.textColor + "33",
              color: branding.textColor,
              backgroundColor: branding.backgroundColor,
            }}
          />
          <label className="flex items-start gap-2 text-sm" style={{ color: branding.textColor }}>
            <input type="checkbox" className="mt-0.5" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            Also send me updates?
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={loading} {...buttonClass(branding, "w-full")}>
            {loading ? "Redirecting to PayPal…" : `Pay ${money(item.price, item.currency)} — PayPal`}
          </button>
          <p className="text-center text-caption" style={{ color: branding.textColor + "77" }}>
            Mock mode: opens a fake PayPal session — no real money moves.
          </p>
        </form>
      </div>
    </Sheet>
  );
}
