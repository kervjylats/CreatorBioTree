/**
 * AddItemPicker — the "Add item" type grid (my-app.md Part 2c). All 16 types
 * are enabled (Stage A, 2026-08-13 — the 9 deferred types landed); each type's
 * fields are handled by the generic ItemEditor. Grouped by how the content is
 * created (2026-08-19): Upload from your device / Links / Everything else.
 */
"use client";

import { CONTENT_TYPES, TYPE_VALUES } from "@/types/contentTypes";
import type { ContentType } from "@/types";

const CATEGORIES: { name: string; hint: string; types: ContentType[] }[] = [
  { name: "Upload from your device", hint: "Files from your phone or computer", types: ["video", "image", "audio", "pdf"] },
  { name: "Links", hint: "Point to something on the web", types: ["link", "live"] },
  { name: "Everything else", hint: "Products, memberships, bookings and more", types: ["product", "physical", "course", "session", "membership", "bundle", "tip_jar", "newsletter", "messaging", "page"] },
];

export const ALL_TYPES: ContentType[] = TYPE_VALUES;

interface AddItemPickerProps {
  onPick: (type: ContentType) => void;
  onClose: () => void;
}

export function AddItemPicker({ onPick, onClose }: AddItemPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-foreground">Add an item</h3>
        <p className="mt-1 text-sm text-muted-foreground">Choose what you&apos;re adding to your app.</p>
        <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat.name}</p>
              <p className="text-caption text-muted-foreground/70">{cat.hint}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {cat.types.map((type) => {
                  const meta = CONTENT_TYPES[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onPick(type)}
                      className="rounded-2xl border border-input bg-background p-3 text-left transition-colors hover:border-foreground"
                    >
                      <div className="text-xl">{meta.icon}</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{meta.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}