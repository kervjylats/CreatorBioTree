/** TODO: Add purpose docstring. */
"use client";

import type { ContentType } from "@/types";
import { ITEM_TYPES } from "@/types/contentTypes";

interface AddItemPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ContentType) => void;
}

export function AddItemPicker({ open, onClose, onSelect }: AddItemPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Add Catalog Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">← Back</button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {ITEM_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => { onSelect(item.type); onClose(); }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all"
            >
              <span className="text-base mt-0.5">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-800">{item.label}</p>
                <p className="text-[9px] text-gray-400 truncate">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
