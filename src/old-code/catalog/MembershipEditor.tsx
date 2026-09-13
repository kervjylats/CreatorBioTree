/** TODO: Add purpose docstring. */
"use client";

interface MembershipEditorProps {
  benefits: string[];
  onChange: (patch: { benefits: string[] }) => void;
}

export function MembershipEditor({ benefits, onChange }: MembershipEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Benefits</label>
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-center gap-1.5 mb-1.5">
            <input
              type="text"
              value={benefit}
              onChange={(e) => {
                const updated = [...benefits];
                updated[i] = e.target.value;
                onChange({ benefits: updated });
              }}
              placeholder="e.g. Exclusive monthly newsletter"
              className="flex-1 px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => onChange({ benefits: benefits.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ benefits: [...benefits, ""] })}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
        >
          + Add benefit
        </button>
      </div>
    </div>
  );
}
