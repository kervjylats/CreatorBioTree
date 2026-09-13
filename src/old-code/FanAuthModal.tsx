/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FanAuthModalProps {
  creatorId: string;
  creatorUsername: string;
  accentColor: string;
  onSuccess: (fanId: string) => void;
  onClose: () => void;
}

type AuthTab = "signup" | "login";

export function FanAuthModal({
  creatorId,
  creatorUsername,
  accentColor,
  onSuccess,
  onClose,
}: FanAuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fan/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          creator_id: creatorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Sign up failed. Please try again."
        );
        setLoading(false);
        return;
      }

      onSuccess(data.fan_id);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fan/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          creator_id: creatorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Login failed. Please check your credentials."
        );
        setLoading(false);
        return;
      }

      onSuccess(data.fan_id);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab switcher */}
        <div className="flex mb-5 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => { setActiveTab("signup"); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setActiveTab("login"); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
        </div>

        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl">
            {activeTab === "signup" ? "👤" : "🔑"}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === "signup" ? `Join @${creatorUsername}` : `Welcome back`}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === "signup"
              ? "Create an account to get notified about new content"
              : "Sign in to access your purchases and notifications"}
          </p>
        </div>

        {/* ── Forgot password form ────────────────────────────── */}
        {forgotMode ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/fan/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: email.trim().toLowerCase(), creator_id: creatorId }),
                });
                if (res.ok) {
                  setForgotSent(true);
                } else {
                  const data = await res.json();
                  setError(typeof data.error === "string" ? data.error : "Something went wrong");
                }
              } catch {
                setError("Network error — please try again");
              }
              setLoading(false);
            }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-600 text-center">
              Enter your email and we'll send you a reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {forgotSent ? (
              <p className="text-sm text-green-600 text-center bg-green-50 rounded-lg px-3 py-2">
                If an account exists, a reset link has been sent.
              </p>
            ) : (
              <Button type="submit" size="sm" styleColor={accentColor} className="w-full" disabled={loading || !email.trim()}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            )}
            <button
              type="button"
              onClick={() => { setForgotMode(false); setForgotSent(false); setError(null); }}
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form
            onSubmit={activeTab === "signup" ? handleSignUp : handleLogin}
            className="space-y-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              size="sm"
              styleColor={accentColor}
              className="w-full"
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading
                ? "Please wait…"
                : activeTab === "signup"
                  ? "Create Account →"
                  : "Sign In →"}
            </Button>

            {activeTab === "login" && (
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="w-full rounded-xl py-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Forgot password?
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Maybe later
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-[10px] text-gray-400">
          Your account is linked to @{creatorUsername}. You can unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}