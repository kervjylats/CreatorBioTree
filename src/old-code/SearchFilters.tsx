/** Search filters bar — debounced search input with URL sync. */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const updateSearch = (newQuery: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set("q", newQuery);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (searchParams.get("q") || "")) {
        updateSearch(query);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchParams]);

  return (
    <>
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white font-bold">
              ⚡
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">CreatorBioTree</span>
          </Link>

          <div className="flex-1 w-full max-w-xl relative">
            <input
              type="text"
              placeholder="Search by name or @username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
            {isPending && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discover Creators</h1>
      </div>
    </>
  );
}

export function ClearFiltersButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/search")}
      className="mt-6 text-sm font-semibold text-indigo-600 hover:underline"
    >
      Clear all filters
    </button>
  );
}
