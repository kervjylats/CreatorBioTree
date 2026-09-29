/**
 * AdminCreatorsTable — list of all creators with stats (admin.md Part 3).
 * Fetches from GET /api/admin/creators. Supports search, feature toggle.
 */
"use client";

import { useEffect, useState } from "react";
import { Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";
import { SearchBox } from "@/components/shared/SearchBox";
import { formatDate } from "@/lib/format";

interface Creator {
  id: string;
  display_name: string;
  username: string;
  email: string;
  is_featured: boolean | null;
  created_at: string;
  fan_count?: number;
  content_count?: number;
}

export function CreatorsTable() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Creator[]>("/api/admin/creators")
      .then((data) => setCreators(Array.isArray(data) ? data : []))
      .catch(() => { toast.error("Failed to load creators"); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = creators.filter(
    (c) =>
      c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleFeature = async (creator: Creator) => {
    try {
      await fetchJson(`/api/admin/creators/${creator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: !creator.is_featured }),
      });
      setCreators((prev) =>
        prev.map((c) => (c.id === creator.id ? { ...c, is_featured: !c.is_featured } : c)),
      );
      toast.success(creator.is_featured ? "Removed from featured" : "Featured creator");
    } catch {
      toast.error("Couldn't update creator");
    }
  };

  return (
    <div className="space-y-4">
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search creators…"
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading creators…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No creators found</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2.5">Creator</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Link Address</th>
                <th className="px-4 py-2.5 text-right">Fans</th>
                <th className="px-4 py-2.5 text-right">Items</th>
                <th className="px-4 py-2.5 text-right">Joined</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium text-foreground">{c.display_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">@{c.username}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{c.fan_count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{c.content_count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleFeature(c)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title={c.is_featured ? "Remove from featured" : "Feature this creator"}
                    >
                      {c.is_featured ? <Star size={14} className="fill-amber-400 text-amber-400" /> : <StarOff size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
