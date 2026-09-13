/** TODO: Add purpose docstring. */
"use client";

interface TipJarEditorProps {
  suggestedAmounts: number[];
  supportMessage: string;
  onChange: (patch: { suggestedAmounts: number[]; supportMessage: string }) => void;
}

export function TipJarEditor({ suggestedAmounts, supportMessage, onChange }: TipJarEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Suggested amounts ($)
        </label>
        <div className="flex items-center gap-1.5">
          {suggestedAmounts.map((amt, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">$</span>
              <input
                type="number"
                min={0}
                value={amt || ""}
                onChange={(e) => {
                  const updated = [...suggestedAmounts];
                  updated[i] = parseInt(e.target.value) || 0;
                  onChange({ suggestedAmounts: updated, supportMessage });
                }}
                className="w-14 px-1.5 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={() => onChange({ suggestedAmounts: suggestedAmounts.filter((_, j) => j !== i), supportMessage })}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ suggestedAmounts: [...suggestedAmounts, suggestedAmounts.length > 0 ? suggestedAmounts[suggestedAmounts.length - 1] + 5 : 5], supportMessage })}
            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
          >
            + Add
          </button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Support message</label>
        <textarea
          value={supportMessage}
          onChange={(e) => onChange({ suggestedAmounts, supportMessage: e.target.value })}
          placeholder="Every coffee fuels the next video!"
          rows={2}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
        <p className="text-[9px] text-amber-700">
          <strong>Mock mode:</strong> Donations are recorded but no real payment is processed.
        </p>
      </div>
    </div>
  );
}
