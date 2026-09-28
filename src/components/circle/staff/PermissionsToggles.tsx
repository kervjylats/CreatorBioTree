/**
 * Eight toggle switches for team permission areas. Settings and Money show
 * warnings when enabled (team.md Part 1).
 * Permission definitions live in src/lib/team-permissions.ts.
 */
"use client";

import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";
import { TEAM_PERMISSIONS } from "@/lib/team-permissions";

interface PermissionsTogglesProps {
  permissions: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
  disabled?: boolean;
}

/** Eight toggle switches for team permission areas. Settings and Money show a warning when enabled (team.md Part 1). */
export function PermissionsToggles({
  permissions,
  onChange,
  disabled,
}: PermissionsTogglesProps) {
  const handleToggle = (key: string, checked: boolean) => {
    onChange({ ...permissions, [key]: checked });
  };

  return (
    <div className="space-y-3">
      {TEAM_PERMISSIONS.map((toggle) => (
        <div key={toggle.key} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{toggle.label}</span>
            {toggle.warning && permissions[toggle.key] && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
          <Switch
            checked={Boolean(permissions[toggle.key])}
            onChange={(checked) => handleToggle(toggle.key, checked)}
            disabled={disabled}
          />
        </div>
      ))}
      {permissions.settings && (
        <p className="text-xs text-amber-600">
          Settings access grants control over account and billing. Only enable for trusted members.
        </p>
      )}
      {permissions.money && (
        <p className="text-xs text-amber-600">
          Money access grants visibility into payouts and financial data. Only enable for trusted members.
        </p>
      )}
    </div>
  );
}
