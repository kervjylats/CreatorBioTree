/** Creator search page — SSR with inline card rendering, no extracted dependencies. */
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchFilters, ClearFiltersButton } from "@/components/search/SearchFilters";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q || "";

  const supabase = await createClient();

  let dbQuery = supabase
    .from("creators")
    .select("id, username, display_name, avatar_url, tags, is_featured")
    .eq("is_discoverable", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
  }

  const { data: creators } = await dbQuery.limit(50);

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16 border-b border-gray-100 bg-white" />}>
        <SearchFilters />
      </Suspense>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {creators && creators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creators.map((creator: any) => (
              <Link
                key={creator.id}
                href={`/${creator.username}`}
                className="group relative flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                {creator.is_featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100">
                    ✨ Featured
                  </div>
                )}
                <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full ring-2 ring-transparent transition-all group-hover:ring-indigo-500/20">
                  {creator.avatar_url ? (
                    <Image src={creator.avatar_url} alt={creator.display_name} width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-indigo-50 text-2xl font-semibold text-indigo-600">
                      {creator.display_name?.[0]?.toUpperCase() || creator.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {creator.display_name || creator.username}
                </h3>
                <p className="text-sm text-gray-400 mb-3">@{creator.username}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">🕵️‍♂️</div>
            <h3 className="text-xl font-bold text-gray-900">No creators found</h3>
            <p className="text-gray-500 max-w-sm mt-2">Try adjusting your search query.</p>
            <Suspense fallback={null}><ClearFiltersButton /></Suspense>
          </div>
        )}
      </main>
    </div>
  );
}
