/** TODO: Add purpose docstring. */
"use client";

interface SessionEditorProps {
  price: number;
  onChange: (patch: { price: number }) => void;
}

export function SessionEditor({ price, onChange }: SessionEditorProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400 italic">
        Sessions are one-on-one bookings. Price is set in the Pricing section. No additional configuration needed here.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
        <p className="text-[9px] text-amber-700">
          <strong>Mock mode:</strong> Schedulable times are generated automatically. Real Calendly/Cal integration will be added later.
        </p>
      </div>
    </div>
  );
}
