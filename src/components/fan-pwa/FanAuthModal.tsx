/** FanAuthModal — unified signup / login / forgot-password modal (fan-shell.md Part 5: email + password only, per-creator accounts). */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import { buttonClass, buttonShape, cardRadius } from "./themeStyles";

interface FanAuthModalProps {
  creatorId: string;
  creatorUsername: string;
  branding: CreatorBranding;
  onSuccess: (fanId: string) => void;
  onClose: () => void;
}

type AuthTab = "signup" | "login";

/** Mock-mode social buttons — real providers plug behind the same buttons at production (spec Part 5). */
const SOCIAL_LOGIN_ORDER = [
  { label: "Google", color: "text-[#4285F4]" },
  { label: "TikTok", color: "text-[#111]" },
  { label: "Instagram", color: "text-[#E1306C]" },
  { label: "Facebook", color: "text-[#1877F2]" },
];

async function post(url: string, body: Record<string, unknown>): Promise<{ data?: unknown; error?: unknown }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Signup / Login / Forgot-password for ONE creator's app. Accounts are independent
 * per creator — the same email on two apps = two independent rows (spec Part 5).
 */
export function FanAuthModal({ creatorId, creatorUsername, branding, onSuccess, onClose }: FanAuthModalProps) {
  const [mode, setMode] = useState<AuthTab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const route = mode === "signup" ? "/api/fan/register" : "/api/fan/login";
      const res = await post(route, { email: email.trim().toLowerCase(), password, creator_id: creatorId });
      if (res.error) {
        // Follower → Fan upgrade: a no-password account (email-only follow) sets its
        // password through the forgot-password flow (same row, per spec Part 1 Layer 1b).
        if (typeof res.error === "string" && res.error.includes("No password is set")) {
          setError("This email already follows — set your password to unlock the full app.");
          setForgotMode(true);
          return;
        }
        setError(typeof res.error === "string" ? res.error : "Something went wrong. Try again.");
        return;
      }
      onSuccess((res.data as { fan_id: string }).fan_id);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await post("/api/fan/forgot-password", { email: email.trim().toLowerCase(), creator_id: creatorId });
      setForgotSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: string) => {
    // Mock login: any provider signs in a test fan with the provider email prefix.
    setError(null);
    setLoading(true);
    try {
      const mockEmail = `${provider.toLowerCase()}-test@fan.pwa`;
      const res = await post("/api/fan/register", {
        email: mockEmail,
        password: "mock-social-pw",
        creator_id: creatorId,
        social: provider,
      });
      if (res.error) {
        // Already exists → log in instead.
        const login = await post("/api/fan/login", {
          email: mockEmail,
          password: "mock-social-pw",
          creator_id: creatorId,
        });
        if (login.error) {
          setError(typeof login.error === "string" ? login.error : "Could not sign in.");
          return;
        }
        onSuccess((login.data as { fan_id: string }).fan_id);
        return;
      }
      onSuccess((res.data as { fan_id: string }).fan_id);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cardRadius(branding, "w-full border px-3 py-2 text-sm outline-none");
  const inputStyle = {
    borderColor: branding.textColor + "33",
    color: branding.textColor,
    backgroundColor: branding.backgroundColor,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className={cardRadius(branding, "w-full max-w-md p-6 shadow-2xl")}
        style={{ backgroundColor: branding.cardColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold" style={{ color: branding.textColor }}>
            {forgotMode ? "Reset your password" : mode === "signup" ? `Join @${creatorUsername}` : "Welcome back"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="hover:opacity-70"
            style={{ color: branding.textColor + "77" }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {!forgotMode && !forgotSent && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {SOCIAL_LOGIN_ORDER.map(({ label, color }) => (
                <button
                  key={label}
                  type="button"
                  disabled={loading}
                  className={`${buttonShape(branding)} border py-2 text-sm font-medium disabled:opacity-50`}
                  style={{ borderColor: branding.textColor + "33", color: branding.textColor }}
                  onClick={() => handleSocial(label)}
                >
                  <span className={color}>{label}</span>
                  <span className="ml-1" style={{ color: branding.textColor + "77" }}>
                    (mock)
                  </span>
                </button>
              ))}
            </div>

            <div className="my-4 flex items-center gap-3 text-xs" style={{ color: branding.textColor + "77" }}>
              <span className="h-px flex-1" style={{ backgroundColor: branding.textColor + "22" }} />
              or use email
              <span className="h-px flex-1" style={{ backgroundColor: branding.textColor + "22" }} />
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="password"
                value={password}
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className={inputClass}
                style={inputStyle}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button type="submit" disabled={loading} {...buttonClass(branding, "w-full disabled:opacity-50")}>
                {loading ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                className="underline"
                style={{ color: branding.textColor + "77" }}
                onClick={() => setForgotMode(true)}
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="font-medium underline"
                style={{ color: branding.accentColor }}
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup" ? "I have an account" : "Create one"}
              </button>
            </div>
          </>
        )}

        {forgotMode && !forgotSent && (
          <form onSubmit={handleForgot} className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
              style={inputStyle}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={loading} {...buttonClass(branding, "w-full disabled:opacity-50")}>
              {loading ? "One moment…" : "Send reset link"}
            </button>
            <button
              type="button"
              className="text-xs underline"
              style={{ color: branding.textColor + "77" }}
              onClick={() => setForgotMode(false)}
            >
              Back to login
            </button>
          </form>
        )}

        {forgotSent && (
          <p className="mt-4 text-sm" style={{ color: branding.textColor + "88" }}>
            If an account exists, a reset link has been sent. (Mock mode: the link is printed to the server console
            and logged in <code>temp_emails.log</code>.)
          </p>
        )}

        <p className="mt-5 text-center text-caption" style={{ color: branding.textColor + "77" }}>
          Your account is linked to @{creatorUsername}. You can unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
