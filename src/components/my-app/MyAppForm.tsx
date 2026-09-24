/**
 * MyAppForm — the My App editor.
 * Renders a Draft/Live/Deployed bar + phone frame inside a centered,
 * fluid container (max-w-[390px]). The phone frame uses CSS
 * width:100% + aspect-ratio to fit any screen automatically.
 * No JavaScript scaling — pure CSS responsiveness.
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
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading My App...
      </div>
    );
  }

  return (
    <div data-tl="MyAppForm" className="flex min-h-screen flex-col items-center justify-center bg-background py-6 pb-[var(--bottom-nav-height)] md:pb-6">
      <div className="w-full max-w-[var(--phone-width)] mx-auto">
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
