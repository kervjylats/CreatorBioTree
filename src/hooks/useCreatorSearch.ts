/**
 * useCreatorSearch — shared creator discovery against GET /api/discover/creators.
 * ONE engine for every placement (Network hub live search, affiliate deal-form
 * resolve, landing showcase/search when built — search.md "one engine").
 * Exports: `searchCreators()` one-shot fetch (resolve exact handle on submit)
 * and `useCreatorSearch()` debounced live-search state (300ms default). Both
 * take an optional field-filter bucket (network.md §1b) — omitted = All.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface CreatorSearchResult {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  is_featured: boolean | null;
  /** Willingness (creators.open_to_collab) — drives the collab-list pool filter
   *  and the disabled "Not open to collabs" button (network.md §1, 2026-10-07). */
  open_to_collab?: boolean | null;
}

/** One-shot discover fetch for `q` (+ optional field bucket) — [] on failure. */
export async function searchCreators(q: string, field = ""): Promise<CreatorSearchResult[]> {
  const params = new URLSearchParams({ q: q.trim() });
  if (field) params.set("field", field);
  const res = await fetch(`/api/discover/creators?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

/** Debounced live-search state: `search(q)` on each keystroke fetches after `debounceMs`. */
export function useCreatorSearch(debounceMs = 300, field = "") {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const search = useCallback(
    (q: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!q.trim()) {
        seqRef.current += 1; // invalidate any in-flight fetch
        setResults([]);
        setLoading(false);
        return;
      }
      timerRef.current = setTimeout(async () => {
        const seq = ++seqRef.current;
        setLoading(true);
        try {
          const r = await searchCreators(q, field);
          if (seq === seqRef.current) setResults(r);
        } catch {
          if (seq === seqRef.current) setResults([]);
        } finally {
          if (seq === seqRef.current) setLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, field]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { query, setQuery, results, setResults, loading, search };
}
