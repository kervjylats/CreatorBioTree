/** TODO: Add purpose docstring. */
"use client";

import type { ContentType, PricingModel, BillingCycle, PricingTier } from "@/types";
import { CONTENT_TYPES, BILLING_CYCLE_VALUES } from "@/types/contentTypes";

interface PricingState {
  pricingModel: PricingModel;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  pwywMinAmount: number;
  perMinuteRate: number;
  perMessageRate: number;
  tieredPricing: PricingTier[];
  stockQuantity: number;
  isPhysical: boolean;
}

interface PricingEditorProps {
  value: PricingState;
  onChange: (state: PricingState) => void;
  itemType: ContentType;
}

const CURRENCIES = ["usd", "eur", "gbp", "aud", "cad"];

const ALL_MODEL_OPTIONS: { value: PricingModel; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid_one_time", label: "Fixed price" },
  { value: "pwyw", label: "Pay what you want" },
  { value: "per_minute", label: "Per minute" },
  { value: "per_message", label: "Per message" },
  { value: "recurring", label: "Subscription" },
  { value: "tiered", label: "Tiered pricing" },
];

export function PricingEditor({ value, onChange, itemType }: PricingEditorProps) {
  const set = (patch: Partial<PricingState>) => onChange({ ...value, ...patch });

  const visibleModels = ALL_MODEL_OPTIONS.filter(
    (m) => CONTENT_TYPES[itemType].allowedPricing.includes(m.value)
  );

  return (
    <div className="space-y-3">
      {/* Pricing model selector */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Pricing</label>
        <div className="grid grid-cols-2 gap-1">
          {visibleModels.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                const patch: Partial<PricingState> = { pricingModel: m.value };
                if (m.value === "per_minute" && value.perMinuteRate === 0) {
                  patch.perMinuteRate = (CONTENT_TYPES[itemType].defaultPricing.perMinuteRate ?? 0);
                }
                if (m.value === "per_message" && value.perMessageRate === 0) {
                  patch.perMessageRate = (CONTENT_TYPES[itemType].defaultPricing.perMessageRate ?? 0);
                }
                set(patch);
              }}
              className={`py-1.5 text-[10px] font-medium rounded-lg border transition-all ${
                value.pricingModel === m.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price / amount fields based on model */}
      {value.pricingModel !== "free" && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          {/* One-time / recurring price */}
          {(value.pricingModel === "paid_one_time" || value.pricingModel === "pwyw" || value.pricingModel === "recurring") && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 block mb-0.5">
                  {value.pricingModel === "recurring" ? "Price per cycle" : "Price"}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={value.price || ""}
                  onChange={(e) => set({ price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 block mb-0.5">Currency</label>
                <select
                  value={value.currency}
                  onChange={(e) => set({ currency: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Recurring cycle */}
          {value.pricingModel === "recurring" && (
            <div>
              <label className="text-[9px] text-gray-400 block mb-0.5">Billing cycle</label>
              <select
                value={value.billingCycle}
                onChange={(e) => set({ billingCycle: e.target.value as BillingCycle })}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {BILLING_CYCLE_VALUES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pay what you want minimum */}
          {value.pricingModel === "pwyw" && (
            <div>
              <label className="text-[9px] text-gray-400 block mb-0.5">Minimum amount (optional)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={value.pwywMinAmount || ""}
                onChange={(e) => set({ pwywMinAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {/* Per-minute */}
          {value.pricingModel === "per_minute" && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 block mb-0.5">Rate per minute</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={value.perMinuteRate || ""}
                  onChange={(e) => set({ perMinuteRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 block mb-0.5">Currency</label>
                <select
                  value={value.currency}
                  onChange={(e) => set({ currency: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Per-message */}
          {value.pricingModel === "per_message" && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 block mb-0.5">Price per message</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={value.perMessageRate || ""}
                  onChange={(e) => set({ perMessageRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 block mb-0.5">Currency</label>
                <select
                  value={value.currency}
                  onChange={(e) => set({ currency: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tiered pricing */}
          {value.pricingModel === "tiered" && (
            <div className="space-y-2">
              <label className="text-[9px] text-gray-400 block mb-0.5">Tiers</label>
              {value.tieredPricing.map((tier, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => {
                      const updated = [...value.tieredPricing];
                      updated[i] = { ...updated[i], name: e.target.value };
                      set({ tieredPricing: updated });
                    }}
                    placeholder="Tier name"
                    className="flex-1 px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.price || ""}
                    onChange={(e) => {
                      const updated = [...value.tieredPricing];
                      updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 };
                      set({ tieredPricing: updated });
                    }}
                    placeholder="Price"
                    className="w-20 px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => set({ tieredPricing: value.tieredPricing.filter((_, j) => j !== i) })}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ tieredPricing: [...value.tieredPricing, { name: "", price: 0 }] })}
                className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
              >
                + Add tier
              </button>
            </div>
          )}

          {/* Physical product */}
          {value.isPhysical && (
            <div>
              <label className="text-[9px] text-gray-400 block mb-0.5">Stock quantity</label>
              <input
                type="number"
                min={0}
                value={value.stockQuantity ?? ""}
                onChange={(e) => set({ stockQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { PricingState };
