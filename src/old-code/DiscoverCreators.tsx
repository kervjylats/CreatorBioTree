/** type: component — Reusable creator discovery with search bar + results grid. */
"use client";

import { useState, useEffect } from "react";
import { CreatorResultCard } from "./CreatorResultCard";

interface DiscoverCreatorsProps {
  initialQuery?: string;
}

export function DiscoverCreators({ initialQuery = "" }: DiscoverCreatorsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [creators, setCreators] = useState<Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null; is_featured: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      const res = await fetch(`/api/creator/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCreators(data ?? []);
      setLoading(false);
    };
    fetchCreators();
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search creators..."
        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
      />

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : creators.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator) => (
            <CreatorResultCard key={creator.id} {...creator} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-gray-400">No creators found.</p>
      )}
    </div>
  );
}
