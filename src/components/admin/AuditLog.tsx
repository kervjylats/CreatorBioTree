/**
 * AuditLog — platform audit log viewer (admin.md Part 3).
 * The `admin_activity_log` table doesn't exist yet, so there is nothing to read
 * and no fetch to make. It now SAYS that plainly instead of sitting in the tab
 * strip looking like a live panel whose rows failed to load (2026-10-01 audit —
 * founder policy: label honestly, never fake a live-looking surface).
 */
import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuditLog() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="flex items-center justify-center gap-2">
        <Construction size={16} className="text-amber-600" />
        <p className="text-sm font-medium text-foreground">Audit log coming soon</p>
        <Badge variant="secondary">Coming soon</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Once the activity log is stored, admin actions — account changes, creator
        edits, API key generation — will be listed here.
      </p>
    </div>
  );
}
