/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CreatorBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreatorHeader } from "./CreatorHeader";
import { InAppBrowserWarning } from "../pwa-install/InAppBrowserWarning";
import { InstallBanner } from "../pwa-install/InstallBanner";
import { IOSInstallGuide } from "../pwa-install/IOSInstallGuide";

interface LandingPageProps {
  branding: CreatorBranding;
  fanCount: number;
  /** If fan already has a session for this creator, skip signup and redirect */
  existingFanId?: string | null;
}

export function LandingPage({ branding, fanCount, existingFanId }: LandingPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // If fan already has a session, auto-redirect to the app
  if (existingFanId) {
    router.replace(`/${branding.creatorUsername}/app`);
    return null;
  }

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
          creator_id: branding.creatorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
        setLoading(false);
        return;
      }

      // Redirect into the fan app
      router.push(data.redirect ?? `/${branding.creatorUsername}/app`);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: branding.fontFamily,
      }}
    >
      <InAppBrowserWarning />

      <main className="max-w-lg mx-auto w-full px-4 pb-32 flex-1">
        {/* Creator identity header */}
        <CreatorHeader
          branding={branding}
          fanCount={fanCount}
        />

        {/* Sign-up form */}
        <div className="mt-8">
          <h2
            className="text-center text-lg font-bold mb-1"
            style={{ color: branding.textColor }}
          >
            Join {branding.appName}
          </h2>
          <p
            className="text-center text-sm mb-6"
            style={{ color: branding.textColor + "80" }}
          >
            Create your account to access exclusive content from{" "}
            {branding.displayName}.
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label
                htmlFor="fan-email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: branding.textColor }}
              >
                Email
              </label>
              <Input
                id="fan-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="fan-password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: branding.textColor }}
              >
                Password
              </label>
              <Input
                id="fan-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="default"
              styleColor={branding.accentColor}
              className="w-full"
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading ? "Creating your account..." : "Create Free Account"}
            </Button>
          </form>

          {/* Social proof */}
          {fanCount > 0 && (
            <p
              className="mt-5 text-center text-xs"
              style={{ color: branding.textColor + "60" }}
            >
              Join {fanCount.toLocaleString()}{" "}
              {fanCount === 1 ? "fan" : "fans"} already following{" "}
              {branding.displayName}.
            </p>
          )}
        </div>
      </main>

      {/* Install prompts */}
      {!isInstalled && (
        <>
          <InstallBanner
            branding={branding}
          />
          <IOSInstallGuide
            branding={branding}
          />
        </>
      )}
    </div>
  );
}