/**
 * Search screen at /search — public creator discovery (search.md Part 1b).
 * Prominent search bar + results grid. Shares the same SearchBar component
 * that the landing page search section will embed (deferred, search.md Part 6).
 */
import type { Metadata } from "next";
import { SearchBar } from "@/components/search/SearchBar";

export const metadata: Metadata = {
  title: "Search Creators — CreatorBioTree",
  description: "Find your favorite creator on CreatorBioTree",
};

export default function SearchScreen() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Search Creators</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Find creators by name or link address
        </p>
        <SearchBar />
      </div>
    </main>
  );
}
