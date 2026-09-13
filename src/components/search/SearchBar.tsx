/**
 * SearchBar — debounced creator search input (search.md Part 3). Fetches
 * from GET /api/search/creators?q=... and renders CreatorResultCard results
 * below the input. Shared component reused by Network (Sheet 18) and
 * landing page search section (deferred).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { CreatorResultCard, type SearchResult } from "./CreatorResultCard";

interface SearchBarProps {
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Optional extra class names. */
  className?: string;
  /** Called when a result is clicked (e.g., navigate). If not provided, results link to /{username}. */
  onSelect?: (username: string) => void;
}

export function SearchBar({ placeholder = "Search by name or link address", className, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search/creators?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search — one request per pause (search.md Part 3).
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void doSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  // Initial load — show all discoverable creators.
  useEffect(() => {
    void doSearch("");
  }, [doSearch]);

  return (
    <div className={className}>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-foreground"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="mt-4 space-y-3">
        {results.length === 0 && hasSearched && !loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {query ? `No creators found for "${query}"` : "No discoverable creators yet"}
            </p>
            {query && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try a different name or link address
              </p>
            )}
          </div>
        )}
        {results.map((r) => (
          <CreatorResultCard key={r.id} result={r} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
