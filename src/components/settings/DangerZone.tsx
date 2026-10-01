/**
 * DangerZone — account actions (settings.md Part 8).
 * Sign out clears the mock cookies and redirects to /login — that one is real.
 * Export and delete are NOT wired: no endpoints exist, so they now say so
 * instead of toasting a success that only printed to the console (2026-10-01
 * audit, founder policy: label honestly, never fake a success).
 */
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Download, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DangerZone() {
  const router = useRouter();

  const handleSignOut = () => {
    document.cookie = "mock_auth_uid=; path=/; max-age=0";
    document.cookie = "mock_auth_email=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  };

  // Export and delete are NOT wired (no endpoints exist yet). They used to toast
  // "Data export started — check console" / "Account deletion requested" after a
  // console.log, so the dialog promised a permanent deletion that never happened
  // (2026-10-01 audit). Honest labels until the real endpoints ship.
  const NOT_WIRED = "This isn’t available yet — nothing was changed.";

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={16} />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleSignOut}>
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Export data</p>
              <p className="text-xs text-muted-foreground">
                Download a copy of all your data
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { toast.info(NOT_WIRED); }}>
              <Download size={14} />
              Export
            </Button>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { toast.info(NOT_WIRED); }}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
