/** useAutoSave — debounced localStorage auto-save (my-app.md Part 4a: 3s cadence, draft survives browser close). */
import { useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  /** localStorage key (e.g. `my-app_draft_${creatorId}`). */
  key: string;
  /** Serialized payload — saved on every change after the debounce delay. */
  data: unknown;
  /** Debounce delay in ms (spec: 3000). */
  delay?: number;
  /** Called on mount with the restored draft (JSON-parsed), if one exists. */
  onRestore?: (data: unknown) => void;
  /** Only save while enabled (e.g. false while still loading the server state). */
  enabled: boolean;
}

/**
 * Auto-saves `data` to `localStorage[key]` every `delay` ms after a change and
 * restores any previous draft on mount. Corrupt JSON / quota errors are silently
 * ignored. Returns a `clear()` helper for the deploy path (deploy clears the draft).
 */
export function useAutoSave({
  key,
  data,
  delay = 3000,
  onRestore,
  enabled,
}: UseAutoSaveOptions): { clear: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!restoredRef.current) {
      restoredRef.current = true;
      try {
        const raw = localStorage.getItem(key);
        if (raw) onRestore?.(JSON.parse(raw));
      } catch {
        /* corrupt draft — ignore */
      }
    }
  }, [key, enabled, onRestore]);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        /* quota — ignore */
      }
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, delay, enabled]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { clear };
}