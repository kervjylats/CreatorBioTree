/**
 * FanExportButton — CSV export button for the fan list.
 * Fetches from GET /api/creator/fans/export which returns a CSV response,
 * then triggers a browser download.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FanExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/creator/fans/export");
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch?.[1] ?? `fan-report.csv`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Fan report downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => void handleExport()}
      disabled={exporting}
    >
      <Download size={14} />
      {exporting ? "Exporting..." : "Export fans CSV"}
    </Button>
  );
}
