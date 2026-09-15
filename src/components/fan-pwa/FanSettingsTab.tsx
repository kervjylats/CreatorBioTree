/**
 * FanSettingsTab.tsx — the fan app Settings tab (fan-shell.md Part 4d):
 * identity card, subscription status, 4 notification toggles, purchase receipts,
 * payment methods stub, PWA install, and logout.
 */
"use client";

import { useState } from "react";
import { Bell, CreditCard, LogOut, Receipt, Shield, Tag, Zap } from "lucide-react";
import { toast } from "sonner";
import type { FanShellData } from "./fanData";
import { money } from "./fanData";
import { buttonClass, buttonShape, cardRadius } from "./themeStyles";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface FanSettingsTabProps {
  data: FanShellData;
}

const NOTIFICATION_KEYS = [
  { key: "new_drops", label: "New drops", desc: "New content from the creator" },
  { key: "lives_events", label: "Lives & events", desc: "Scheduled live streams and events" },
  { key: "partner_updates", label: "Partner updates", desc: "Updates from partners you follow" },
  { key: "announcements", label: "Announcements", desc: "Community announcements" },
] as const;

export function FanSettingsTab({ data }: FanSettingsTabProps) {
  const { branding, identity } = data;
  const { installState, triggerInstall } = usePWAInstall();

  const [notify, setNotify] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(`fan_notify_${branding.creatorId}`) === "1",
  );

  // Notification toggles — each stored independently in localStorage.
  const [toggles, setToggles] = useState(() => {
    const initial: Record<string, boolean> = {};
    for (const t of NOTIFICATION_KEYS) {
      const key = `fan_notif_${branding.creatorId}_${t.key}`;
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      initial[t.key] = stored !== "0"; // Default ON
    }
    return initial;
  });

  const totalSpent = data.purchases.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
  const titleFor = (itemId: string) => data.items.find((i) => i.id === itemId)?.title ?? null;

  // Subscription: check for an active recurring membership purchase.
  const hasMembership = data.purchases.some(
    (p) =>
      p.status === "completed" &&
      data.items.some((i) => i.id === p.content_item_id && i.type === "membership"),
  );

  const handleLogout = async () => {
    await fetch("/api/fan/logout", { method: "POST" });
    window.location.href = `/${data.username}/guest`;
  };

  const toggleNotification = (key: string) => {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      window.localStorage.setItem(`fan_notif_${branding.creatorId}_${key}`, next[key] ? "1" : "0");
      toast(next[key] ? "Notification on" : "Notification muted");
      return next;
    });
  };

  const installHint =
    installState === "ios-guide"
      ? "On iPhone: Share → Add to Home Screen."
      : installState === "in-app"
        ? "Open in your phone's browser (Safari/Chrome) to install."
        : installState === "installed"
          ? "This app is installed — check your home screen."
          : "Install this app from your browser's menu to keep it one tap away.";

  return (
    <div data-tl="FanSettingsTab" className="min-h-full w-full" style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}>
      <div className="mx-auto w-full max-w-lg">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-extrabold" style={{ color: branding.textColor }}>
          Settings
        </h1>
      </div>

      {/* Identity card */}
      <section className="px-4 pt-4">
        <div className={cardRadius(branding, "p-4")} style={{ backgroundColor: branding.cardColor }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "77" }}>
            Your account
          </p>
          <p className="mt-1 text-sm font-semibold break-all" style={{ color: branding.textColor }}>
            {identity?.email ?? "Guest"}
          </p>
          <p className="text-xs" style={{ color: branding.textColor + "77" }}>
            {identity?.hasPassword ? "Fan — full access" : "Follower — email only"}
          </p>
          {!identity?.hasPassword && (
            <p className="mt-2 text-xs" style={{ color: branding.accentColor }}>
              Add a password to unlock the full app — use &quot;Sign in&quot; on your guest page.
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`${buttonShape(branding)} mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold`}
            style={{ backgroundColor: branding.textColor + "11", color: branding.textColor }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </section>

      {/* Subscription */}
      <section className="px-4 pt-5">
        <div className={cardRadius(branding, "p-4")} style={{ backgroundColor: branding.cardColor }}>
          <div className="flex items-center gap-2">
            <Tag size={16} style={{ color: branding.accentColor }} />
            <h2 className="text-sm font-bold" style={{ color: branding.textColor }}>Membership</h2>
          </div>
          {hasMembership ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-micro font-bold uppercase"
                style={{ backgroundColor: branding.accentColor + "22", color: branding.accentColor }}>
                Active
              </span>
              <span className="text-xs" style={{ color: branding.textColor + "88" }}>
                You&apos;re a member
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs" style={{ color: branding.textColor + "77" }}>
              No active membership — browse the catalog to join.
            </p>
          )}
        </div>
      </section>

      {/* Notification toggles */}
      <section className="px-4 pt-5">
        <div className={cardRadius(branding, "p-4")} style={{ backgroundColor: branding.cardColor }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} style={{ color: branding.accentColor }} />
            <h2 className="text-sm font-bold" style={{ color: branding.textColor }}>Notifications</h2>
          </div>
          <div className="flex flex-col gap-3">
            {NOTIFICATION_KEYS.map((t) => (
              <div key={t.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: branding.textColor }}>{t.label}</p>
                  <p className="text-caption" style={{ color: branding.textColor + "77" }}>{t.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggles[t.key]}
                  onClick={() => toggleNotification(t.key)}
                  className="h-6 w-11 rounded-full transition-colors"
                  style={{ backgroundColor: toggles[t.key] ? branding.accentColor : branding.textColor + "33" }}
                >
                  <span
                    className="block h-5 w-5 rounded-full bg-white transition-transform"
                    style={{ transform: toggles[t.key] ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Receipts — email-keyed purchases, server-side truth (decision #12) */}
      <section className="px-4 pt-5">
        <div className="flex items-center gap-2">
          <Receipt size={16} style={{ color: branding.accentColor }} />
          <h2 className="text-sm font-bold" style={{ color: branding.textColor }}>
            Your purchases
          </h2>
        </div>
        {data.purchases.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: branding.textColor + "77" }}>
            No purchases yet — your receipts land here the moment you buy.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {data.purchases.map((p) => (
              <div
                key={p.id}
                className={cardRadius(branding, "flex items-center justify-between px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <div>
                  <p className="text-sm font-semibold">{titleFor(p.content_item_id) ?? "Purchase"}</p>
                  <p className="text-xs" style={{ color: branding.textColor + "77" }}>
                    {new Date(p.purchased_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold">{money(p.amount_paid ?? 0, p.currency)}</p>
              </div>
            ))}
            <p className="text-right text-xs font-semibold" style={{ color: branding.textColor + "88" }}>
              Total spent: {money(totalSpent, data.purchases[0]?.currency)}
            </p>
          </div>
        )}
      </section>

      {/* Payment methods — production stub */}
      <section className="px-4 pt-5">
        <div className={cardRadius(branding, "p-4")} style={{ backgroundColor: branding.cardColor }}>
          <div className="flex items-center gap-2">
            <CreditCard size={16} style={{ color: branding.textColor + "66" }} />
            <h2 className="text-sm font-bold" style={{ color: branding.textColor }}>Payment methods</h2>
          </div>
          <p className="mt-2 text-xs" style={{ color: branding.textColor + "77" }}>
            Payment is handled via PayPal at checkout. Saved payment methods will appear here after launch.
          </p>
        </div>
      </section>

      {/* PWA */}
      <section className="px-4 pt-5 pb-24">
        <div className={cardRadius(branding, "px-4 py-3")} style={{ backgroundColor: branding.cardColor }}>
          <p className="text-sm font-semibold" style={{ color: branding.textColor }}>
            Install {branding.displayName}&apos;s app
          </p>
          {installState === "android-ready" ? (
            <button type="button" {...buttonClass(branding, "mt-2")} onClick={() => triggerInstall()}>
              Install now
            </button>
          ) : (
            <p className="mt-1 text-xs" style={{ color: branding.textColor + "77" }}>
              {installHint}
            </p>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
