/** TODO: Add purpose docstring. */
"use client";

interface MessagingEditorProps {
  autoResponse: string;
  onChange: (patch: { autoResponse: string }) => void;
}

export function MessagingEditor({ autoResponse, onChange }: MessagingEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Auto-response message</label>
        <textarea
          value={autoResponse ?? ""}
          onChange={(e) => onChange({ autoResponse: e.target.value })}
          placeholder="Thanks for your message! I'll respond within 48 hours."
          rows={3}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
    </div>
  );
}
