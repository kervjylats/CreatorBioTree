/**
 * AppIdentityCard — compact standalone card for the installed-app identity
 * (app icon + app name + link address + IconDesigner). Sits to the left of
 * the phone preview as a always-visible card, no longer inside a tab.
 * Draft-only writes; Deploy pushes to the fan app.
 */
"use client";

import { useState } from "react";
import { ImageIcon, Palette } from "lucide-react";
import { IconDesigner } from "@/components/my-app/IconDesigner";
import type { MyAppIconDesign } from "@/types";
import type { MyAppDraft } from "@/hooks/useMyAppForm";

interface AppIdentityCardProps {
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
  username: string;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground";

export function AppIdentityCard({ draft, patch, username }: AppIdentityCardProps) {
  const profile = draft.custom_theme.profile;
  const [designing, setDesigning] = useState(!profile.appIconUrl);

  const setIcon = (appIconUrl: string, iconDesign: MyAppIconDesign) =>
    patch({
      custom_theme: { ...draft.custom_theme, profile: { ...profile, appIconUrl, iconDesign } },
    });

  const iconInitial = (profile.appName || draft.display_name || "A").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Icon preview — centered, clickable to open designer */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setDesigning(true)}
          className="group relative cursor-pointer"
          title="Click to design your app icon"
        >
          {profile.appIconUrl ? (
            <img
              src={profile.appIconUrl}
              alt="App icon"
              className="h-16 w-16 rounded-[18px] border border-black/10 object-cover shadow-md transition group-hover:ring-2 group-hover:ring-accent"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center text-2xl font-bold text-white shadow-md transition group-hover:ring-2 group-hover:ring-accent"
              style={{ backgroundColor: draft.custom_theme.colors.accent, borderRadius: 18 }}
            >
              {iconInitial}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 rounded-full bg-background border border-border p-1 opacity-0 transition group-hover:opacity-100">
            <Palette size={10} />
          </span>
        </button>
      </div>

      {/* App name */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">App name</label>
        <input
          value={profile.appName}
          onChange={(e) => patch({ custom_theme: { ...draft.custom_theme, profile: { ...profile, appName: e.target.value } } })}
          className={fieldClass}
          placeholder="My App"
        />
        <p className="mt-1 text-caption text-muted-foreground">
          Name under the icon on fans&apos; home screen.
        </p>
      </div>

      {/* Link Address — read-only */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Link Address</label>
        <div className="mt-1 rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
          /{username}
        </div>
        <p className="mt-1 text-caption text-muted-foreground">Permanent — never changeable.</p>
      </div>

      {/* Show/Hide designer toggle */}
      <button
        type="button"
        onClick={() => setDesigning((d) => !d)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
          designing ? "bg-foreground text-background" : "border border-input text-foreground"
        }`}
      >
        <Palette size={12} /> {designing ? "Hide designer" : "Show designer"}
      </button>

      {/* IconDesigner — conditional */}
      {designing && (
        <IconDesigner
          appName={profile.appName}
          design={profile.iconDesign ?? null}
          onUse={(appIconUrl, iconDesign) => {
            setIcon(appIconUrl, iconDesign);
            setDesigning(false);
          }}
          onCancel={() => setDesigning(false)}
        />
      )}
    </div>
  );
}
