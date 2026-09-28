"use client";

/**
 * Affiliate deal creation form — lets a creator configure a new affiliate
 * deal: collaborator (@username, resolved to their account via the search
 * API), scope, deal type, trigger, rate, custom terms, and validity dates
 * (network.md §7, monetization/creators.md Part 2). Per-item deals pick a
 * catalog item from a dropdown — external-link items are excluded.
 */
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";

interface AffiliateDealFormProps {
  onSubmit: (deal: DealFormData) => void | Promise<void>;
  onCancel?: () => void;
}

export interface DealFormData {
  owner_id?: string;
  promoter_id: string;
  scope: "item" | "creator";
  item_id?: string;
  deal_type: "percentage" | "fixed" | "free" | "tiered" | "custom";
  trigger: "purchase" | "follow" | "subscribe" | "tip" | "signup" | "any";
  rate?: number;
  custom_terms?: string;
  valid_from?: string;
  valid_until?: string;
}

interface CatalogItem {
  id: string;
  title: string;
  payment_handling?: string | null;
}

export function AffiliateDealForm({ onSubmit, onCancel }: AffiliateDealFormProps) {
  const [promoterName, setPromoterName] = useState("");
  const [scope, setScope] = useState<"item" | "creator">("creator");
  const [itemId, setItemId] = useState("");
  const [dealType, setDealType] = useState<DealFormData["deal_type"]>("percentage");
  const [trigger, setTrigger] = useState<DealFormData["trigger"]>("purchase");
  const [rate, setRate] = useState("");
  const [customTerms, setCustomTerms] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load the creator's own catalog once — drives the per-item picker.
  useEffect(() => {
    let alive = true;
    fetch("/api/creator/catalog")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        if (alive) setItems(Array.isArray(d.data) ? d.data : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const pickerItems = items.filter((i) => i.payment_handling !== "external_link");
  const hiddenExternals = items.length - pickerItems.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const q = promoterName.replace(/^@/, "").trim();
    if (!q) {
      setFormError("Enter the collaborator's @name.");
      return;
    }
    if (scope === "item" && !itemId) {
      setFormError("Pick which item this deal covers.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/search/creators?q=${encodeURIComponent(q)}`);
      const data = res.ok ? await res.json() : {};
      const match = (data.results ?? []).find(
        (r: { username?: string }) => r.username?.toLowerCase() === q.toLowerCase()
      );
      if (!match) {
        setFormError(`No discoverable creator found for @${q} — check the name.`);
        return;
      }
      await onSubmit({
        promoter_id: match.id,
        scope,
        item_id: scope === "item" ? itemId : undefined,
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
              We look up their account when you hit Create.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scope</label>
              <Select value={scope} onValueChange={(v) => setScope(v as "item" | "creator")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Per-creator (entire catalog)</SelectItem>
                  <SelectItem value="item">Per-item (single item)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          {scope === "item" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Item this deal covers</label>
              <Select value={itemId} onValueChange={(v) => setItemId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={pickerItems.length ? "Pick an item" : "No eligible items"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {pickerItems.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pickerItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No eligible items — add catalog items in My App first.
                </p>
              ) : hiddenExternals > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {hiddenExternals} external-link item{hiddenExternals > 1 ? "s" : ""} hidden
                  (excluded from deals)
                </Badge>
              ) : null}
            </div>
          )}

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
