/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect } from "react";

export function StripeConnectPanel() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/stripe/connect");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch Stripe status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create onboarding link.");
      }
    } catch (err) {
      console.error("Failed to connect Stripe:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-3xl bg-[#F7F5F0]" />;
  }

  const isConnected = status?.connected;

  return (
    <div className="rounded-3xl border border-[#E8E4DB] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-gray-900">Payments (Stripe Connect)</h2>
            {isConnected ? (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                ACTIVE
              </span>
            ) : (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500 border border-gray-100">
                INACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Link your Stripe account to receive automatic payouts for your sales.
            We use Stripe Express to handle secure splits and partner commissions.
          </p>

          {!isConnected && status?.details_submitted && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 border border-amber-100">
              ⚠️ Your Stripe account needs attention. Some details might still be missing or your account is being verified.
            </div>
          )}
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
            isConnected
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-[#5A6A4A] text-white hover:bg-[#47543a] shadow-lg shadow-[#D4CBB6]/20"
          }`}
        >
          {connecting ? "Loading…" : isConnected ? "Manage Account" : "Connect Stripe"}
        </button>
      </div>

      {isConnected && (
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account ID</p>
            <p className="text-sm font-mono text-gray-600">{status.account_id}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
            <p className="text-sm text-gray-600">
              {status.charges_enabled ? "✅ Ready to accept payments" : "⏳ Verification in progress"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
