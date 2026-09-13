/**
 * PaymentsPanel — PayPal connect panel (mock mode).
 * Shows connection status and a "Connect PayPal" button. In mock mode,
 * clicking the button shows a success toast and notes the account is set.
 * Payout rail = creator's PayPal balance.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentsPanel() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/my-app")
      .then((r) => r.json())
      .then((data) => {
        setConnected(!!data?.creator?.paypal_email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    toast.success("PayPal account connected (mock)");
    setConnected(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">Loading payments...</p>
        </CardContent>
      </Card>
    );
  }

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
        {connected ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              PayPal connected
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your PayPal account to start receiving payouts.
            </p>
            <Button onClick={handleConnect}>
              <ExternalLink size={14} />
              Connect PayPal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
