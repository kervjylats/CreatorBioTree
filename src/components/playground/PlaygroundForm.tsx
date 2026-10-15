/**
 * PlaygroundForm — the Playground editor (playground.md Parts 1 + 1d + 1e).
 * Top-level switch: Fans = phone frame (always renders the DRAFT + the honest
 * Draft/Live status beacon + Deploy, never-scroll fit) | Billboard =
 * result-preview + billboard editors (`?view=billboard`, saves immediately).
 * The 📌 "Who I am" note (shared identity, Draft + Deploy) sits top-left in
 * BOTH views. `?tab=` deep-links a fan surface inside Fans view
 * (FAN_TAB_IDS validation unchanged). 2026-10-15: the Draft|Live preview
 * pills are GONE (dead control — see PreviewStateToggle).
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlaygroundForm } from "@/hooks/usePlaygroundForm";
import type { ContentItem, FanViewId } from "@/types";
import { FAN_TAB_IDS } from "@/lib/nav-config";
import { buildPreviewData } from "./previewData";
import { PhonePreview } from "./PhonePreview";
import { PreviewStateToggle } from "./PreviewStateToggle";
import { BillboardView } from "./BillboardView";
import { IdentityNote } from "./IdentityNote";

type PlaygroundView = "fans" | "billboard";

interface PlaygroundFormProps {
  initialTab?: string;
  initialView?: string;
}

/** Phone frame width — pure CSS fit-to-space (responsive.md §7): max-width =
 *  min(420px, max(220px, (100dvh − chrome) × 390/844)); chrome = 172px on
 *  phones / 116px at ≥768px (breakpoint token in globals.css). */
const FIT_MAX_WIDTH =
  "min(var(--phone-max-w), max(var(--phone-min-w), calc((100dvh - var(--preview-chrome)) * var(--phone-ratio-w) / var(--phone-ratio-h))))";

const VIEW_OPTIONS: readonly { id: PlaygroundView; label: string }[] = [
  { id: "fans", label: "Fans" },
  { id: "billboard", label: "Billboard" },
];

export function PlaygroundForm({ initialTab, initialView }: PlaygroundFormProps) {
  const { loading, baseCreator, serverItems, draft, hasChanges, patch, deploy, deploying } = usePlaygroundForm();
  const [view, setView] = useState<PlaygroundView>(
    initialView === "billboard" ? "billboard" : "fans"
  );
  const [activeTab, setActiveTab] = useState<FanViewId>(
    initialTab && (FAN_TAB_IDS as readonly string[]).includes(initialTab)
      ? (initialTab as FanViewId)
      : "home"
  );

  const [items, setItems] = useState<ContentItem[]>([]);
  useEffect(() => {
    if (serverItems.length > 0 || !loading) setItems(serverItems);
  }, [serverItems, loading]);

  const previewData = useMemo(() => {
    if (!baseCreator) return null;
    return buildPreviewData(draft, baseCreator, items);
  }, [draft, baseCreator, items]);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  /** Flip views + keep the URL shareable (history API — no RSC roundtrip). */
  const switchView = useCallback((next: PlaygroundView) => {
    setView(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "fans") params.delete("view");
    else params.set("view", next);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  if (loading || !previewData) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center text-sm text-muted-foreground">
        Loading Playground...
      </div>
    );
  }

  return (
    <div
      data-tl="PlaygroundForm"
      className="flex min-h-screen-safe flex-col bg-background py-6 pb-[var(--bottom-nav-height)] md:pb-6"
    >
      {/* Header row — 📌 note (top-left, Part 1e) · switch (center) · spacer
          keeps the switch optically centered where the note has no twin. */}
      <div className="mb-4 flex items-center justify-between gap-2 px-4">
        {baseCreator && (
          <IdentityNote draft={draft} patch={patch} baseCreator={baseCreator} dirty={hasChanges} />
        )}
        <div className="flex w-fit shrink-0 rounded-full border border-input bg-muted p-0.5">
          {VIEW_OPTIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => switchView(v.id)}
              aria-pressed={view === v.id}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                view === v.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="hidden w-[118px] shrink-0 sm:block" aria-hidden />
      </div>

      {view === "billboard" ? (
        <div className="mx-auto w-full max-w-lg px-4">
          <BillboardView />
        </div>
      ) : (
        <div className="mx-auto my-auto w-full" style={{ maxWidth: FIT_MAX_WIDTH }}>
          <PreviewStateToggle
            hasChanges={hasChanges}
            deploying={deploying}
            onDeploy={deploy}
          />
          <PhonePreview
            data={previewData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      )}
    </div>
  );
}
