/** TODO: Add purpose docstring. */
"use client";

import type { ContentItem } from "@/types";

interface BundleEditorProps {
  selectedIds: string[];
  allItems: ContentItem[];
  bundlePrice: number;
  bundleId: string;
  onChange: (ids: string[]) => void;
}

export function BundleEditor({ selectedIds, allItems, bundlePrice, bundleId, onChange }: BundleEditorProps) {
  const availableItems = allItems.filter((i) => i.id !== bundleId);
  const selectedSet = new Set(selectedIds);
  const totalItemPrice = selectedIds.reduce((sum, id) => {
    const item = allItems.find((i) => i.id === id);
    return sum + (item ? item.price : 0);
  }, 0);
  const savings = totalItemPrice - bundlePrice;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Included items ({selectedIds.length})
        </label>
        <div className="max-h-40 overflow-y-auto space-y-0.5 border border-gray-200 rounded-lg p-1">
          {availableItems.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedSet.has(item.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedIds, item.id]);
                  } else {
                    onChange(selectedIds.filter((id) => id !== item.id));
                  }
                }}
                className="w-3 h-3 accent-indigo-600"
              />
              <span className="text-[10px] text-gray-700 flex-1 truncate">{item.title}</span>
              <span className="text-[9px] text-gray-400 shrink-0">${item.price.toFixed(2)}</span>
            </label>
          ))}
        </div>
        {availableItems.length === 0 && (
          <p className="text-[9px] text-gray-400 italic">Create other items first to bundle them here.</p>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 space-y-0.5">
          <p className="text-[9px] text-green-700">Sum of items: <strong>${totalItemPrice.toFixed(2)}</strong></p>
          <p className="text-[9px] text-green-700">Bundle price: <strong>${bundlePrice.toFixed(2)}</strong></p>
          {savings > 0 && (
            <p className="text-[9px] text-green-800 font-semibold">Fan saves: ${savings.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
