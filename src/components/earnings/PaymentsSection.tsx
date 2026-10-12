"use client";

/**
 * PaymentsSection (earnings.md §3) — where money lands: the PayPal.me handle
 * editor (the one edit home — debtors' [Pay now] opens it) plus the honest
 * PaymentsPanel connect card moved from Settings (settings.md Part 2 pointer).
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INPUT_CLASS } from "@/lib/ui-constants";
import { fetchJson } from "@/lib/fetchJson";
import { PaymentsPanel } from "./PaymentsPanel";

const HANDLE_RE = /^[A-Za-z0-9._-]{3,77}$/;

export function PaymentsSection() {
  const [handle, setHandle] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson<{ paypal_handle: string | null }>("/api/creator/earnings/paypal")
      .then((d) => {
        setHandle(d.paypal_handle ?? "");
        setSaved(d.paypal_handle ?? "");
      })
      .catch(() => toast.error("Couldn't load your payout details"))
      .finally(() => setLoading(false));
  }, []);

  const trimmed = handle.trim();
  const valid = trimmed === "" || HANDLE_RE.test(trimmed);
  const dirty = trimmed !== (saved ?? "");
  const preview = trimmed.length >= 3 && valid ? `paypal.me/${trimmed}` : null;

  const save = async () => {
    setSaving(true);
    try {
      await fetchJson("/api/creator/earnings/paypal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypal_handle: trimmed || null }),
      });
      setSaved(trimmed);
      toast.success(trimmed ? "PayPal.me handle saved" : "Handle removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="paypal-handle" className="text-sm font-medium">
              Get paid — your PayPal.me handle
            </label>
            <p className="text-xs text-muted-foreground">
              Your collaborators open this to pay you — it&apos;s where [Pay now] lands.
            </p>
            <input
              id="paypal-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourname"
              maxLength={77}
              disabled={loading}
              className={INPUT_CLASS}
            />
            {preview && <p className="mt-1 text-xs text-muted-foreground">{preview}</p>}
            {!valid && (
              <p className="mt-1 text-xs text-destructive">
                Use 3–77 letters, digits, dots, dashes or underscores.
              </p>
            )}
          </div>
          <Button size="sm" onClick={save} disabled={saving || !dirty || !valid || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Fan payments land directly in your PayPal balance — the platform never holds your money.
          </p>
        </CardContent>
      </Card>
      <PaymentsPanel />
    </div>
  );
}
