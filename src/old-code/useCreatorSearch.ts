/** type: hook — Fetches discoverable creators by name/username search. */
"use client";

import { useState, useEffect } from "react";
import { CREATOR_SEARCH_FIELDS, buildSearchFilter } from "./search-utils";

export interface SearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tags: string[] | null;
  is_featured: boolean;
}

export function useCreatorSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [creators, setCreators] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      const supabase = (await import("@/lib/supabase/client")).createClient();
      let dbQuery = supabase
        .from("creators")
        .select(CREATOR_SEARCH_FIELDS)
        .eq("is_discoverable", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      const filter = buildSearchFilter(query);
      if (filter) dbQuery = dbQuery.or(filter);

      const { data } = await dbQuery.limit(50);
      setCreators((data ?? []) as unknown as SearchResult[]);
      setLoading(false);
    };
    fetchCreators();
  }, [query]);

  return { creators, loading, query, setQuery };
}
