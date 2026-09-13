/** Playground — phone preview, branding editor (identity/design), deploy panel, unsaved-changes modal. */
"use client";

import { Component, useState, useEffect, useCallback } from "react";
import { PhonePreview } from "@/components/creator-dashboard/PhonePreview";
import { BottomEditor } from "@/components/creator-dashboard/BottomEditor";
import { PlaygroundInfoBanner } from "@/components/creator-dashboard/PlaygroundInfoBanner";
import { BottomPanel } from "@/components/creator-dashboard/BottomPanel";
import { usePlaygroundForm } from "@/hooks/usePlaygroundForm";
import { UnsavedChangesModal } from "@/hooks/useAutoSave";
import { useRouter } from "next/navigation";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div className="p-6 bg-red-50 min-h-screen flex items-center justify-center"><div className="max-w-md bg-white p-6 rounded-2xl shadow-lg"><h2 className="text-lg font-bold text-red-600">Error: {this.state.error.message}</h2></div></div>;
    return this.props.children;
  }
}

export default function PlaygroundPage() {
  const form = usePlaygroundForm();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const href = (e as CustomEvent).detail;
      if (href) {
        setPendingHref(href);
        setModalOpen(true);
      }
    };
    window.addEventListener("trigger-unsaved-modal", handler);
    return () => window.removeEventListener("trigger-unsaved-modal", handler);
  }, []);

  const handleLeaveWithoutSaving = useCallback(() => {
    setModalOpen(false);
    (window as any).isFormDirty = false;
    router.push(pendingHref);
  }, [pendingHref, router]);

  const handleSaveAndLeave = useCallback(async () => {
    await form.handleDeploy();
    setModalOpen(false);
    router.push(pendingHref);
  }, [pendingHref, router, form]);

  if (form.loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 top-14 lg:top-0 lg:left-60 flex flex-col">
        <PlaygroundInfoBanner />

        <div className="flex-1 flex relative overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <PhonePreview
              theme={form.theme} branding={form.previewBranding}
              selection={null}
              onSelect={() => {}}
              activeView={form.activeView} onViewChange={form.setActiveView} guestMode={form.activeView === "guest"}
              showMiniStrip
            />
          </div>
        </div>

        <BottomEditor
          theme={form.theme}
          onColorsChange={form.updateColors}
          onFontStyleChange={form.onFontStyleChange}
          onButtonStyleChange={form.onButtonStyleChange}
          onAiPaletteGenerated={form.onAiPaletteGenerated}
          onAppNameChange={form.onAppNameChange}
          onAppIconUpload={form.onAppIconUpload}
          bio={form.creatorBio}
          onBioChange={form.setCreatorBio}
          displayName={form.creatorDisplayName}
          onDisplayNameChange={form.setCreatorDisplayName}
          username={form.username}
          onUsernameChange={form.setUsername}
        />
        <BottomPanel
          onDeploy={form.handleDeploy}
          saving={form.saving}
          hasChanges={form.hasChanges}
        />
      </div>

      <UnsavedChangesModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
        onSaveAndLeave={handleSaveAndLeave}
      />
    </ErrorBoundary>
  );
}
