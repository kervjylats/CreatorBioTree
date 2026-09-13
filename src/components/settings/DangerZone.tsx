/**
 * DangerZone — destructive account actions: data export and account deletion.
 * Export logs to console; delete shows a confirmation dialog then logs to console.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DangerZone() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleExport = () => {
    toast.success("Data export started — check console");
    console.log("[DangerZone] Export data requested");
  };

  const handleDelete = () => {
    toast.success("Account deletion requested — check console");
    console.log("[DangerZone] Delete account requested");
    setDeleteOpen(false);
  };

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
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Export data</p>
              <p className="text-xs text-muted-foreground">
                Download a copy of all your data
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download size={14} />
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-destructive/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Your account and all associated data
            will be permanently deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
