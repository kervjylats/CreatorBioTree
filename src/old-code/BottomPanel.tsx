/** TODO: Add purpose docstring. */
"use client";

import { Button } from "@/components/ui/button";

interface BottomPanelProps {
  onDeploy: () => void;
  saving: boolean;
  hasChanges: boolean;
}

export function BottomPanel({ onDeploy, saving, hasChanges }: BottomPanelProps) {
  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2 flex items-center justify-between">
      <span className="text-[10px] text-gray-400">
        Changes are local until you deploy
      </span>
      <div className="flex items-center gap-2">
        {hasChanges && <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unsaved</span>}
        <Button
          onClick={onDeploy}
          disabled={saving}
          size="sm"
        >
          {saving ? "..." : "Deploy Changes"}
        </Button>
      </div>
    </div>
  );
}
