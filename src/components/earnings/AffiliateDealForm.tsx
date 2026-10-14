"use client";

/**
 * Affiliate deal creation form — lets a creator configure a new affiliate
 * deal: collaborator (@username, resolved to their account via the search
 * API), deal type, trigger, rate, custom terms, and validity dates
 * (network.md §7, monetization/creators.md Part 2). Creator-only since 2026-10-10
 * (earnings.md §1): no per-item scope — a deal covers the owner's whole catalog.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchCreators } from "@/hooks/useCreatorSearch";

interface AffiliateDealFormProps {
  onSubmit: (deal: DealFormData) => void | Promise<void>;
  onCancel?: () => void;
}

export interface DealFormData {
  owner_id?: string;
  promoter_id: string;
  deal_type: "percentage" | "fixed" | "free" | "tiered" | "custom";
  trigger: "purchase" | "follow" | "subscribe" | "tip" | "signup" | "any";
  rate?: number;
  custom_terms?: string;
  valid_from?: string;
  valid_until?: string;
}

export function AffiliateDealForm({ onSubmit, onCancel }: AffiliateDealFormProps) {
  const [promoterName, setPromoterName] = useState("");
  const [dealType, setDealType] = useState<DealFormData["deal_type"]>("percentage");
  const [trigger, setTrigger] = useState<DealFormData["trigger"]>("purchase");
  const [rate, setRate] = useState("");
  const [customTerms, setCustomTerms] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const q = promoterName.replace(/^@/, "").trim();
    if (!q) {
      setFormError("Enter the collaborator's @name.");
      return;
    }
    setSubmitting(true);
    try {
      const results = await searchCreators(q);
      const match = results.find(
        (r) => r.username?.toLowerCase() === q.toLowerCase()
      );
      if (!match) {
        setFormError(`No discoverable creator found for @${q} — check the name.`);
        return;
      }
      await onSubmit({
        promoter_id: match.id,
        deal_type: dealType,
        trigger,
        rate: rate ? Number(rate) : undefined,
        custom_terms: customTerms || undefined,
        valid_from: validFrom || undefined,
        valid_until: validUntil || undefined,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create the deal — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Affiliate Deal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Collaborator @username</label>
            <Input
              value={promoterName}
              onChange={(e) => setPromoterName(e.target.value)}
              placeholder="@theirname"
              required
            />
            <p className="text-xs text-muted-foreground">
              Deals are partner-only — they must be one of your partners (Connect in Network first). We look up their account when you hit Create.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal Type</label>
              <Select value={dealType} onValueChange={(v) => setDealType(v as DealFormData["deal_type"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed amount ($)</SelectItem>
                  <SelectItem value="free">Free cross-promo</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                  <SelectItem value="custom">Custom terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trigger</label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as DealFormData["trigger"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="follow">Follow</SelectItem>
                  <SelectItem value="subscribe">Subscribe</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="signup">Signup</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(dealType === "percentage" || dealType === "fixed") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {dealType === "percentage" ? "Rate (%)" : "Amount ($)"}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder={dealType === "percentage" ? "e.g. 10" : "e.g. 5.00"}
                />
              </div>
            )}
          </div>

          {(dealType === "custom" || dealType === "tiered") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Terms</label>
              <Textarea
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="Describe the deal terms..."
                rows={3}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid From</label>
              <Input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid Until</label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Deal"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
