/** Login form — creator/staff gateway (login.md): email+password, Gumroad-style error copy, ?next= deep-link, mock-only social buttons. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

interface LoginFormProps {
  next?: string | null;
}

const MOCK_SOCIALS = [
  { key: "google", label: "Google", email: "google-test@creatorpwa.test" },
  { key: "tiktok", label: "TikTok", email: "tiktok-test@creatorpwa.test" },
  { key: "instagram", label: "Instagram", email: "instagram-test@creatorpwa.test" },
  { key: "facebook", label: "Facebook", email: "facebook-test@creatorpwa.test" },
] as const;

function setMockSession(uid: string, userEmail: string) {
  document.cookie = `mock_auth_uid=${uid}; path=/; max-age=3600`;
  document.cookie = `mock_auth_email=${encodeURIComponent(userEmail)}; path=/; max-age=3600`;
}

function SocialIcon({ platform }: { platform: (typeof MOCK_SOCIALS)[number]["key"] }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      {platform === "google" && (
        <path d="M21.35 11.1H12v2.9h5.4c-.45 2.25-2.25 3.9-4.7 3.9-2.85 0-5.2-2.3-5.2-5.15s2.35-5.15 5.2-5.15c1.3 0 2.5.5 3.4 1.25l2.15-2.15C16.85 3.95 14.5 3.05 12 3.05 6.9 3.05 2.75 7.2 2.75 12.35S6.9 21.65 12 21.65c5.55 0 8.65-4.05 8.65-8.5 0-.55-.05-1.2-.3-2.05z" />
      )}
      {platform === "tiktok" && (
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12v-3.15a5.75 5.75 0 1 0 4.96 5.66V8.8a7.3 7.3 0 0 0 4.22 1.35V7.06a4.22 4.22 0 0 1-3.22-1.24z" />
      )}
      {platform === "instagram" && (
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
      )}
      {platform === "facebook" && (
        <path d="M24 12a12 12 0 1 0-13.88 11.85v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.46h-2.8v8.39A12 12 0 0 0 24 12z" />
      )}
    </svg>
  );
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfterLogin = () => {
    router.push(next ?? "/dashboard");
    router.refresh();
  };

  const signIn = async (targetEmail: string, targetPassword: string) => {
    const supabase = createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (loginError && USE_MOCKS) {
      // Mock mode: any email + password logs in (creates/signs in the mock user).
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
        options: { data: { display_name: "" } },
      });
      if (!signUpError && signUpData?.user) {
        setMockSession(signUpData.user.id, signUpData.user.email ?? targetEmail);
        redirectAfterLogin();
        return;
      }
    }

    if (loginError) {
      // Gumroad-style root-cause copy (production only — mock never errors).
      if (loginError.message.toLowerCase().includes("deleted")) {
        setError("This account was deleted. Create a new one to get started.");
      } else {
        const { data: existing } = await supabase
          .from("creators")
          .select("id")
          .eq("email", targetEmail.trim().toLowerCase())
          .maybeSingle();
        setError(
          existing
            ? "The password you entered was incorrect."
            : "An account does not exist with that email."
        );
      }
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      setMockSession(data.user.id, targetEmail);
    }
    redirectAfterLogin();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await signIn(email, password);
  };

  const handleSocial = async (socialEmail: string) => {
    // Mock only: direct client-side mock action — sign in/create the test account + cookies.
    setError(null);
    setLoading(true);
    await signIn(socialEmail, "mock-social-password");
  };

  return (
    <div data-tl="LoginForm" className="text-left">
      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          label="Email Address"
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
          placeholder="••••••••"
        />

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Signing in..." : "Sign In →"}
        </Button>
      </form>

      <p className="mt-3 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
          Forgot your password?
        </Link>
      </p>

      {USE_MOCKS && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Continue with
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center gap-3">
            {MOCK_SOCIALS.map((social) => (
              <Tooltip key={social.key}>
                <TooltipTrigger
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocial(social.email)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                  aria-label={`Continue with ${social.label}`}
                >
                  <SocialIcon platform={social.key} />
                </TooltipTrigger>
                <TooltipContent side="bottom">Test login: {social.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/onboarding" className="font-semibold text-primary hover:underline">
          Create one free
        </Link>
      </p>

      {USE_MOCKS && (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          * Social buttons are mock-only — they sign in a test account.
        </p>
      )}
    </div>
  );
}