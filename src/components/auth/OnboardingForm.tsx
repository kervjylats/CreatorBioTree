/** Onboarding form (onboarding.md) — Link Address with live availability, display name, email, password; confirm-on-permanence dialog; ?invite= support. */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

interface OnboardingFormProps {
  inviteCode?: string;
  rootDomain: string;
}

type Availability = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

function setMockSession(uid: string, userEmail: string) {
  document.cookie = `mock_auth_uid=${uid}; path=/; max-age=3600`;
  document.cookie = `mock_auth_email=${encodeURIComponent(userEmail)}; path=/; max-age=3600`;
}

export function OnboardingForm({ inviteCode, rootDomain }: OnboardingFormProps) {
  const router = useRouter();
  const [linkAddress, setLinkAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [availability, setAvailability] = useState<Availability>("idle");
  const checkTimer = useRef<number | null>(null);
  const requestSeq = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard/my-app");
    });
  }, [router]);

  const checkAvailability = useCallback((value: string) => {
    requestSeq.current++; // invalidate any in-flight check from a previous value
    if (checkTimer.current !== null) {
      window.clearTimeout(checkTimer.current);
      checkTimer.current = null;
    }
    if (!value) {
      setAvailability("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(value)) {
      setAvailability("invalid");
      return;
    }
    setAvailability("checking");
    checkTimer.current = window.setTimeout(() => {
      checkTimer.current = null;
      const seq = requestSeq.current;
      fetch(`/api/creator/check-username?username=${encodeURIComponent(value)}`)
        .then(async (res) => {
          if (seq !== requestSeq.current) return; // stale response — a newer check is in flight
          if (!res.ok) {
            setAvailability("error");
            return;
          }
          const data = await res.json();
          setAvailability(data.available ? "available" : "taken");
        })
        .catch(() => {
          if (seq !== requestSeq.current) return;
          setAvailability("error");
        });
    }, 400);
  }, []);

  const handleLinkAddressChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setLinkAddress(cleaned);
    checkAvailability(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (availability !== "available") {
      setError(
        availability === "error"
          ? "Couldn't check availability — retry before continuing."
          : "Choose a link address that is available."
      );
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setConfirmOpen(true);
  };

  const performSignUp = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          ...(inviteCode ? { invite_code: inviteCode } : {}),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      setMockSession(data.user.id, data.user.email ?? email);
    }

    const res = await fetch("/api/creator/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: linkAddress, display_name: displayName.trim() }),
    });
    const result = await res.json().catch(() => null);

    if (!res.ok) {
      setError(result?.error ?? "Failed to create your account.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/my-app");
    router.refresh();
  };

  return (
    <div className="text-left">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Link Address"
          type="text"
          required
          value={linkAddress}
          onChange={(e) => handleLinkAddressChange(e.target.value)}
          placeholder="yourname"
          autoComplete="off"
        />
        <div className="-mt-3 text-xs">
          {availability === "available" && (
            <p className="text-green-600 font-medium">Available — {rootDomain}/{linkAddress}</p>
          )}
          {availability === "taken" && (
            <p className="text-red-500 font-medium">That link address is already taken.</p>
          )}
          {availability === "invalid" && (
            <p className="text-muted-foreground">
              3–20 characters: lowercase letters, numbers, underscores only.
            </p>
          )}
          {availability === "error" && (
            <p className="text-red-500 font-medium">
              Couldn&apos;t check availability — type again to retry.
            </p>
          )}
          {availability !== "taken" &&
            availability !== "invalid" &&
            availability !== "error" && (
              <p className="text-muted-foreground">
                Choose carefully — this is your fan-facing URL and can&apos;t be changed later.
              </p>
            )}
        </div>

        <Input
          label="Display Name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name or brand"
        />

        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          minLength={8}
        />

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Creating account…" : "Create account →"}
        </Button>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Link Address is permanent</DialogTitle>
            <DialogDescription>
              Your Link Address can never be changed. Fans will visit you at{" "}
              {rootDomain}/{linkAddress}. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <Button onClick={performSignUp} disabled={loading}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
