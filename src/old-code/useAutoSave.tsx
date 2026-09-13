/** TODO: Add purpose docstring. */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

// ─── useAutoSave ─────────────────────────────────────────────────────────────

interface UseAutoSaveOptions {
  key: string;
  data: unknown;
  delay?: number;
  onRestore?: (data: unknown) => void;
  enabled: boolean;
}

export function useAutoSave({ key, data, delay = 3000, onRestore, enabled }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!enabled || mountedRef.current) return;
    mountedRef.current = true;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        onRestore?.(parsed);
      }
    } catch {
      // Corrupted draft — ignore
    }
  }, [key, enabled, onRestore]);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, delay, enabled]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return { clear };
}

// ─── UnsavedChangesModal ─────────────────────────────────────────────────────

interface UnsavedChangesModalProps {
  open: boolean;
  onCancel: () => void;
  onLeaveWithoutSaving: () => void;
  onSaveAndLeave: () => void;
}

export function UnsavedChangesModal({
  open,
  onCancel,
  onLeaveWithoutSaving,
  onSaveAndLeave,
}: UnsavedChangesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Unsaved changes
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          You have unsaved changes. Do you want to save before leaving?
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button               variant="destructive" onClick={onLeaveWithoutSaving}>
            Leave without saving
          </Button>
          <Button               variant="default" onClick={onSaveAndLeave}>
            Save &amp; Leave
          </Button>
        </div>
      </div>
    </div>
  );
}
