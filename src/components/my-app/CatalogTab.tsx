/**
 * CatalogTab — the creator's catalog manager (my-app.md Part 2c): list items
 * with publish/featured/reorder/delete, "Add item" picker (all 16 types —
 * Stage A 2026-08-13) and the per-item editor. Catalog changes save
 * immediately via the catalog API — they never enter the theme draft.
 */
"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ContentItem, ContentType } from "@/types";
import { TYPE_ICONS } from "@/types/contentTypes";
import { AddItemPicker } from "./catalog/AddItemPicker";
import { ItemEditor } from "./catalog/ItemEditor";

interface CatalogTabProps {
  items: ContentItem[];
  onItemsChange: (items: ContentItem[]) => void;
}

export function CatalogTab({ items, onItemsChange }: CatalogTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const api = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  };

  const handleAdd = async (type: ContentType) => {
    setPickerOpen(false);
    try {
      const res = await api("/api/creator/catalog", {
        method: "POST",
        body: JSON.stringify({ type, title: "Untitled" }),
      });
      onItemsChange([...(items ?? []), res.data as ContentItem]);
      setEditing(res.data as ContentItem);
      toast("Item added — fill it in and publish.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add item");
    }
  };

  const handleSave = async (updated: ContentItem) => {
    const { creators, ...patchable } = updated as ContentItem & { creators?: unknown };
    void creators;
    await api(`/api/creator/catalog/${updated.id}`, { method: "PATCH", body: JSON.stringify(patchable) });
    onItemsChange(items.map((i) => (i.id === updated.id ? updated : i)));
    toast.success("Item saved");
  };

  const quickPatch = async (item: ContentItem, partial: Partial<ContentItem>) => {
    await api(`/api/creator/catalog/${item.id}`, { method: "PATCH", body: JSON.stringify(partial) });
    onItemsChange(items.map((i) => (i.id === item.id ? { ...i, ...partial } : i)));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onItemsChange(next);
    // Persist new order (fire-and-forget; failure rolls back visually on reload).
    for (const [orderIdx, it] of next.entries()) {
      if (it.sort_order !== orderIdx + 1) {
        await api(`/api/creator/catalog/${it.id}`, { method: "PATCH", body: JSON.stringify({ sort_order: orderIdx + 1 }) }).catch(() => {});
      }
    }
  };

  const remove = async (item: ContentItem) => {
    await api(`/api/creator/catalog/${item.id}`, { method: "DELETE" });
    onItemsChange(items.filter((i) => i.id !== item.id));
    toast("Item deleted");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Catalog ({items.length})</h3>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background"
        >
          <Plus size={14} /> Add item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Your catalog is empty — add your first item to see it on the phone.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-input bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground"
                  onClick={() => setEditing(item)}
                >
                  <span className="mr-1">{TYPE_ICONS[item.type]}</span>
                  {item.title}
                  {!item.is_published && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">
                      draft
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Toggle featured"
                    className={`rounded-lg p-1.5 ${item.is_featured ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => quickPatch(item, { is_featured: !item.is_featured })}
                  >
                    <Star size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={item.is_published}
                  onChange={(e) => quickPatch(item, { is_published: e.target.checked })}
                />
                Published to fans
              </label>
            </div>
          ))}
        </div>
      )}

      {pickerOpen && <AddItemPicker onPick={(t) => void handleAdd(t)} onClose={() => setPickerOpen(false)} />}
      {editing && (
        <ItemEditor item={editing} catalogItems={items} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}