/**
 * MyAppForm — the My App editor (preview-first: the frame is the only surface).
 * Draft/Live bar + phone frame in a centered container. Never-scroll fit:
 * max-width = min(420px, max(220px, (100dvh - chrome) × 390/844)); chrome is
 * 172px on phones / 116px at ≥768px (breakpoint token in globals.css). Pure
 * CSS — reads available space, not device names. my-auto centers; the 220px
 * floor only engages on extreme viewports (landscape / very short windows)
 * where a hair of scroll beats an unusable sliver.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMyAppForm } from "@/hooks/useMyAppForm";
import type { ContentItem, FanViewId } from "@/types";
import { FAN_TAB_IDS } from "@/lib/nav-config";
import { buildPreviewData } from "./previewData";
import { PhonePreview } from "./PhonePreview";
import { PreviewStateToggle, type PreviewState } from "./PreviewStateToggle";

interface MyAppFormProps {
  initialTab?: string;
}

const FIT_MAX_WIDTH =
  "min(var(--phone-max-w), max(var(--phone-min-w), calc((100dvh - var(--preview-chrome)) * var(--phone-ratio-w) / var(--phone-ratio-h))))";

export function MyAppForm({ initialTab }: MyAppFormProps) {
  const { loading, baseCreator, serverItems, draft, hasChanges, deploy, deploying } = useMyAppForm();
  const [state, setState] = useState<PreviewState>("live");
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

  if (loading || !previewData) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center text-sm text-muted-foreground">
        Loading My App...
      </div>
    );
  }

  return (
    <div data-tl="MyAppForm" className="flex min-h-screen-safe flex-col items-center bg-background py-6 pb-[var(--bottom-nav-height)] md:pb-6">
      <div className="mx-auto my-auto w-full" style={{ maxWidth: FIT_MAX_WIDTH }}>
        <PreviewStateToggle
          state={state}
          onChange={setState}
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
    </div>
  );
}
