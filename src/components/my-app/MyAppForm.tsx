/**
 * MyAppForm — the full My App editor (my-app.md Part 1): full-screen phone
 * preview of the REAL fan components (draft-driven), PreviewStateToggle +
 * Deploy, tap-to-edit ElementPopover, the slide-up editor sheet (Option A:
 * 4-tab strip: Design / Catalog / Links / Spotlight), and the Unsaved badge.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMyAppForm } from "@/hooks/useMyAppForm";
import type { ContentItem } from "@/types";
import { buildPreviewData } from "./previewData";
import type { EditModeTarget } from "@/components/fan-pwa/GuestPageContent";
import { PhonePreview } from "./PhonePreview";
import { PreviewStateToggle, type PreviewState } from "./PreviewStateToggle";
import { ElementPopover } from "./ElementPopover";
import { AutoSaveStatus } from "./AutoSave";
import { AppIdentityCard } from "./AppIdentityCard";
import { DesignTab } from "./DesignTab";
import { CatalogTab } from "./CatalogTab";
import { LinksTab } from "./LinksTab";

const TABS: { id: TabId; label: string; soon?: boolean }[] = [
  { id: "design", label: "Design" },
  { id: "catalog", label: "Catalog" },
  { id: "links", label: "Links" },
  { id: "spotlight", label: "Spotlight", soon: true },
];

type TabId = "design" | "catalog" | "links" | "spotlight";

const VALID_TABS: TabId[] = ["design", "catalog", "links", "spotlight"];

interface MyAppFormProps {
  initialTab?: string;
}

export function MyAppForm({ initialTab }: MyAppFormProps) {
  const { loading, baseCreator, serverItems, draft, hasChanges, patch, deploy, deploying } = useMyAppForm();
  const [state, setState] = useState<PreviewState>("live");
  const [tab, setTab] = useState<TabId>(
    initialTab && VALID_TABS.includes(initialTab as TabId) ? (initialTab as TabId) : "design"
  );
  const [editTarget, setEditTarget] = useState<EditModeTarget | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Catalog edits are write-through (saved immediately) — keep a local copy so
  // the phone preview reflects adds/edits without a reload.
  const [items, setItems] = useState<ContentItem[]>([]);
  useEffect(() => {
    if (serverItems.length > 0 || !loading) setItems(serverItems);
  }, [serverItems, loading]);

  const previewData = useMemo(() => {
    if (!baseCreator) return null;
    return buildPreviewData(draft, baseCreator, items);
  }, [draft, baseCreator, items]);

  // Warn before leaving with un-deployed changes (draft survives in localStorage).
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  if (loading || !previewData) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading My App…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-foreground">My App</h1>
          <AutoSaveStatus hasChanges={hasChanges} saving={false} />
        </div>
        <PreviewStateToggle
          state={state}
          onChange={setState}
          hasChanges={hasChanges}
          deploying={deploying}
          onDeploy={deploy}
        />
      </header>

      {/* Segmented control — visible below md: (tablet+ gets the 3-column layout) */}
      <div className="sticky top-[52px] z-30 flex border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex gap-1 rounded-full border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMobileTab("editor")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              mobileTab === "editor" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Design
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              mobileTab === "preview" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-4 py-6 md:flex-row md:items-start md:justify-center lg:px-6">
        {/* App Identity Card — wide desktop only (left column at xl:) */}
        <div className={`shrink-0 ${mobileTab !== "editor" ? "hidden" : "hidden xl:block xl:w-56"}`}>
          <AppIdentityCard draft={draft} patch={patch} username={previewData.username} />
        </div>

        {/* Phone — tablet+ center, mobile via segmented control */}
        <div className={`${mobileTab === "preview" ? "mx-auto" : "hidden md:block"} shrink-0`}>
          <PhonePreview data={previewData} editMode onEdit={setEditTarget} />
        </div>

        {/* Editor sheet — tablet+ right, mobile via segmented control */}
        <div className={`${mobileTab !== "editor" ? "hidden md:block" : "w-full md:flex-1 lg:max-w-xl"} flex-1`}>
          <div className="sticky top-20 rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {t.soon && <span className="ml-1 opacity-60">soon</span>}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {tab === "design" && <DesignTab draft={draft} patch={patch} />}
              {tab === "catalog" && <CatalogTab items={items} onItemsChange={setItems} />}
              {tab === "links" && <LinksTab draft={draft} patch={patch} />}
              {tab === "spotlight" && (
                <div className="rounded-2xl border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
                  Spotlight arrives in a later pass — the phone preview keeps working.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editTarget && (
        <ElementPopover target={editTarget} draft={draft} patch={patch} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}