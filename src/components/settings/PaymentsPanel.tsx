/**
 * PaymentsPanel — PayPal connect panel (settings.md Part 2). Payout rail = the
 * creator's own PayPal balance (PayPal-first, founder decision 2026-08-10).
 */
"use client";

// Honest state (2026-10-01 audit): the real `paypal/connect` OAuth route does not
// exist yet, so this panel no longer fakes a connection. It used to read
// `creator.paypal_email` — a field the playground route never selected — and its
// button toasted "PayPal account connected" while persisting nothing, so the
// status silently reverted on reload. Until Sheet 9's connect route ships, the
// panel says so.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

export function PaymentsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Payouts go to your PayPal balance. Fans pay via PayPal Checkout —
          cards accepted without a PayPal account.
        </p>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-4 py-3">
          <Construction size={16} className="text-amber-600" />
          <span className="text-sm text-muted-foreground">
            Connecting a PayPal account isn&apos;t wired up yet.
          </span>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <Button disabled>Connect PayPal</Button>
        <p className="text-xs text-muted-foreground">
          Fan payments already work in mock mode; this is the step that attaches
          YOUR account to receive them.
        </p>
      </CardContent>
    </Card>
  );
}
