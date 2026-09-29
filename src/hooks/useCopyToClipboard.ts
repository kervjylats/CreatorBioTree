/**
 * useCopyToClipboard — shared clipboard write + 2s "copied" flag
 * (duplication audit 2026-09-29 #16; was hand-rolled in ApiKeysPanel,
 * AffiliateLinks, PartnerInviteCard, QrCard). `copy()` resolves true/false —
 * callers keep their own toast copy.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { copied, copy };
}
