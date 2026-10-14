"use client";

/**
 * DealDialog (network.md §7 + creators.md 2b2 — Batch B 2026-10-12) — the
 * compact "Make a deal" composer opened from a CollabList row's handshake
 * icon: partner prefilled, fields mirror AffiliateDealForm (type · rate ·
 * trigger · note), submit → POST /api/creator/affiliates/deals (partners-only
 * server-side — the 403 surfaces inline).
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type DealType = "percentage" | "fixed" | "free" | "tiered" | "custom";
type DealTrigger = "purchase" | "follow" | "subscribe" | "tip" | "signup" | "any";

interface DealDialogProps {
  partner: { id: string; display_name: string } | null;
  onClose: () => void;
}

export function DealDialog({ partner, onClose }: DealDialogProps) {
  const [dealType, setDealType] = useState<DealType>("percentage");
  const [trigger, setTrigger] = useState<DealTrigger>("purchase");
  const [rate, setRate] = useState("");
  const [customTerms, setCustomTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partner) return;
    const needsRate = dealType === "percentage" || dealType === "fixed";
    if (needsRate && !rate) {
      toast.error(dealType === "percentage" ? "Enter a percentage." : "Enter an amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/creator/affiliates/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoter_id: partner.id,
          deal_type: dealType,
          trigger,
          rate: rate ? Number(rate) : undefined,
          custom_terms: customTerms || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(typeof d.error === "string" ? d.error : "Couldn't create the deal.");
        return;
      }
      toast.success(`Deal created with ${partner.display_name}`);
      setRate("");
      setCustomTerms("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!partner} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a deal{partner ? ` with ${partner.display_name}` : ""}</DialogTitle>
          <DialogDescription>
            They promote your whole catalog under these terms. Prefer to negotiate first?
            Send a deal card from your partner chat instead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deal type</label>
            <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
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

          {(dealType === "percentage" || dealType === "fixed") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {dealType === "percentage" ? "Rate (%)" : "Amount ($)"}
              </label>
              <Input
                type="number"
                min={0}
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={dealType === "percentage" ? "e.g. 10" : "e.g. 5.00"}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Trigger</label>
            <Select value={trigger} onValueChange={(v) => setTrigger(v as DealTrigger)}>
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

          {(dealType === "custom" || dealType === "tiered") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Terms</label>
              <Textarea
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="Describe the deal terms..."
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
