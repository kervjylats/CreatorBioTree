/** TODO: Add purpose docstring. */
"use client";

import type { CreatorBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";

interface FanSettingsTabProps {
  branding: CreatorBranding;
  fanId: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function FanSettingsTab({ branding, fanId, onLoginClick, onLogout }: FanSettingsTabProps) {
  return (
    <div className="px-4 pt-6 space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: branding.textColor + "80" }}>
        Settings
      </h2>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "10" }}>
        <p className="text-sm font-semibold">{branding.appName}</p>
        <p className="text-xs mt-1" style={{ color: branding.textColor + "60" }}>
          Creator: @{branding.creatorUsername}
        </p>
      </div>

      {fanId ? (
        <>
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: branding.textColor + "50" }}>
              My Account
            </h3>
            <div className="space-y-3 p-4 rounded-xl border" style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "10" }}>
              <p className="text-sm" style={{ color: branding.textColor + "80" }}>
                You&rsquo;re subscribed to updates from @{branding.creatorUsername}.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: branding.textColor + "50" }}>
              Notifications
            </h3>
            <div className="space-y-3 p-4 rounded-xl border" style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "10" }}>
              <div className="flex items-center justify-between opacity-50">
                <span className="text-sm">{branding.displayName}</span>
                <div className="relative w-10 h-6 rounded-full" style={{ backgroundColor: branding.textColor + "20" }}>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
                </div>
              </div>
              <p className="text-xs italic" style={{ color: branding.textColor + "40" }}>
                Push Notifications (Coming soon) — will be available once external services are connected.
              </p>
            </div>
          </section>

          <Button onClick={onLogout} size="sm" styleColor={branding.accentColor} className="w-full">
            Log Out
          </Button>
        </>
      ) : (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: branding.textColor + "50" }}>
            Account
          </h3>
          <div className="space-y-4 p-5 rounded-xl border text-center" style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "10" }}>
            <p className="text-sm font-medium" style={{ color: branding.textColor + "80" }}>
              Sign up to get notified when @{branding.creatorUsername} posts new content
            </p>
            <Button onClick={onLoginClick} size="sm" styleColor={branding.accentColor} className="w-full">
              Sign Up / Login
            </Button>
          </div>
        </section>
      )}

      <p className="text-center text-xs pt-2" style={{ color: branding.textColor + "30" }}>
        CreatorBioTree · v1.0
      </p>
    </div>
  );
}
