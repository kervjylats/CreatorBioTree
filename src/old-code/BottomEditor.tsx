/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import type { PlaygroundTheme } from "@/types";
import { AppIdentityEditor } from "./AppIdentityEditor";
import { GlobalSettingsEditor } from "./GlobalSettingsEditor";

type EditorTab = "identity" | "design";

interface BottomEditorProps {
  theme: PlaygroundTheme;
  onColorsChange: (c: Partial<PlaygroundTheme["colors"]>) => void;
  onFontStyleChange: (f: PlaygroundTheme["fontStyle"]) => void;
  onButtonStyleChange: (b: PlaygroundTheme["buttonStyle"]) => void;
  onAiPaletteGenerated: (p: Record<string, string>) => void;
  onAppNameChange: (name: string) => void;
  onAppIconUpload: (file: File) => Promise<string | null>;
  onBgUploadStart?: (file: File) => Promise<string | null>;
  scrapedData?: { title?: string; image?: string } | null;
  bio: string;
  onBioChange: (bio: string) => void;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  username: string;
  onUsernameChange: (username: string) => void;
  collapsible?: boolean;
}

const TABS: { id: EditorTab; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "design", label: "Design" },
];

export function BottomEditor(props: BottomEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("identity");
  const [collapsed, setCollapsed] = useState(false);

  const renderEditor = () => {
    switch (activeTab) {
      case "identity":
        return (
          <AppIdentityEditor
            theme={props.theme}
            onAppNameChange={props.onAppNameChange}
            onAppIconUpload={props.onAppIconUpload}
            bio={props.bio}
            onBioChange={props.onBioChange}
            displayName={props.displayName}
            onDisplayNameChange={props.onDisplayNameChange}
            username={props.username}
            onUsernameChange={props.onUsernameChange}
          />
        );
      case "design":
        return (
          <GlobalSettingsEditor
            theme={props.theme}
            onColorsChange={props.onColorsChange}
            onFontStyleChange={props.onFontStyleChange}
            onButtonStyleChange={props.onButtonStyleChange}
            onAiPaletteGenerated={props.onAiPaletteGenerated}
            onBgUploadStart={props.onBgUploadStart || (async () => null)}
            scrapedData={props.scrapedData}
          />
        );
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[10px] font-medium py-2.5 px-1 text-center transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-700 bg-indigo-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-2 py-2.5 text-gray-400 hover:text-gray-600 border-b-2 border-transparent"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 max-h-64 overflow-y-auto">
          {renderEditor()}
        </div>
      )}
    </div>
  );
}
