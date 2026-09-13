/** TODO: Add purpose docstring. */
"use client";

interface NewsletterEditorProps {
  welcomeEmail: string;
  pricingModel: string;
  onChange: (patch: { welcomeEmail: string }) => void;
}

export function NewsletterEditor({ welcomeEmail, pricingModel, onChange }: NewsletterEditorProps) {
  const isPaid = pricingModel === "recurring";
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Welcome email</label>
        <textarea
          value={welcomeEmail}
          onChange={(e) => onChange({ welcomeEmail: e.target.value })}
          placeholder={isPaid ? "Welcome! You'll get premium content every month." : "Welcome! Stay tuned for updates."}
          rows={3}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
        <p className="text-[9px] text-amber-700">
          <strong>{isPaid ? "Paid mode" : "Free mode"}:</strong>{" "}
          {isPaid
            ? "Set the price in the Pricing section. Fans subscribe and pay monthly."
            : "No payment needed. Fans enter their email to subscribe. Email capture is mocked."}
        </p>
      </div>
    </div>
  );
}
