/** TODO: Add purpose docstring. */
"use client";

interface PhysicalEditorProps {
  variants: string[];
  stockQuantity: number;
  onChange: (patch: { variants: string[]; stockQuantity: number }) => void;
}

export function PhysicalEditor({ variants, stockQuantity, onChange }: PhysicalEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Stock quantity</label>
        <input
          type="number"
          min={0}
          value={stockQuantity ?? ""}
          onChange={(e) => onChange({ variants, stockQuantity: parseInt(e.target.value) || 0 })}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Variants (optional)</label>
        {variants.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 mb-1.5">
            <input
              type="text"
              value={v}
              onChange={(e) => {
                const updated = [...variants];
                updated[i] = e.target.value;
                onChange({ variants: updated, stockQuantity });
              }}
              placeholder="e.g. Small, Medium, Large"
              className="flex-1 px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => onChange({ variants: variants.filter((_, j) => j !== i), stockQuantity })}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ variants: [...variants, ""], stockQuantity })}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
        >
          + Add variant
        </button>
      </div>
    </div>
  );
}
