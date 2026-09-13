/**
 * PricingEditor — price/access/payment-handling block for a catalog item
 * (my-app.md Part 2c + monetization/creators.md Part 1c): free vs locked vs
 * paid, in-app (PayPal) vs external-link checkout (with the affiliate-quarantine
 * amber warning), price + currency. All changes emit `patch` — the parent saves.
 */
"use client";

import { AlertTriangle } from "lucide-react";
import type { AccessType, BillingCycle, ContentItem, PricingModel } from "@/types";

interface PricingEditorProps {
  item: ContentItem;
  patch: (partial: Partial<ContentItem>) => void;
}

const ACCESS_LABELS: Record<AccessType, string> = {
  free: "Free — anyone can view",
  locked: "Email-gated — unlock with an email (follow)",
  paid: "Paid — buy to view",
};

export function PricingEditor({ item, patch }: PricingEditorProps) {
  const paid = item.access_type === "paid";
  const external = item.payment_handling === "external_link";

  return (
    <div className="space-y-4">
      {/* Access */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Who can see it?</label>
        <div className="mt-2 flex flex-col gap-2">
          {(Object.keys(ACCESS_LABELS) as AccessType[]).map((access) => (
            <label
              key={access}
              className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                item.access_type === access ? "border-foreground bg-accent/20" : "border-input"
              }`}
            >
              <input
                type="radio"
                name="access"
                checked={item.access_type === access}
                onChange={() =>
                  patch({
                    access_type: access,
                    pricing_model:
                      access === "paid"
                        ? item.pricing_model && item.pricing_model !== "free"
                          ? item.pricing_model
                          : "paid_one_time"
                        : "free",
                  })
                }
                className="mt-0.5"
              />
              <span className="text-foreground">{ACCESS_LABELS[access]}</span>
            </label>
          ))}
        </div>
      </div>

      {paid && (
        <>
          {/* Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.price}
                onChange={(e) => patch({ price: Math.max(0, Number(e.target.value)) })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Currency</label>
              <select
                value={item.currency}
                onChange={(e) => patch({ currency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {["USD", "EUR", "GBP", "AUD", "CAD", "MUR"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing model + billing cycle */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Billing model</label>
              <select
                value={!item.pricing_model || item.pricing_model === "free" ? "paid_one_time" : item.pricing_model}
                onChange={(e) => patch({ pricing_model: e.target.value as PricingModel })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="paid_one_time">One-time</option>
                <option value="recurring">Subscription</option>
                <option value="pwyw">Pay what you want</option>
              </select>
            </div>
            {item.pricing_model === "recurring" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Billing cycle</label>
                <select
                  value={item.billing_cycle ?? "monthly"}
                  onChange={(e) => patch({ billing_cycle: e.target.value as BillingCycle })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {["weekly", "monthly", "yearly"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment handling */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">How is it paid?</label>
            <div className="mt-2 flex flex-col gap-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  !external ? "border-foreground bg-accent/20" : "border-input"
                }`}
              >
                <input
                  type="radio"
                  name="handling"
                  checked={!external}
                  onChange={() => patch({ payment_handling: "in_app" })}
                  className="mt-0.5"
                />
                <span className="text-foreground">
                  In-app checkout (PayPal) — fans pay right here, receipts automatic
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  external ? "border-foreground bg-accent/20" : "border-input"
                }`}
              >
                <input
                  type="radio"
                  name="handling"
                  checked={external}
                  onChange={() => patch({ payment_handling: "external_link" })}
                  className="mt-0.5"
                />
                <span className="text-foreground">
                  External link — “Buy” opens your own PayPal.me / Stripe Payment Link / Gumroad
                </span>
              </label>
            </div>
            {external && (
              <div className="mt-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle size={14} className="mr-1 inline" />
                External-link items are excluded from affiliate deals — the platform can&apos;t split what it
                can&apos;t see (external-link quarantine, monetization/creators.md Part 1c).
              </div>
            )}
            {external && (
              <input
                type="url"
                placeholder="https://paypal.me/you / https://gumroad.com/l/…"
                value={item.external_payment_url ?? ""}
                onChange={(e) => patch({ external_payment_url: e.target.value })}
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export type { PricingModel };