/** TODO: Add purpose docstring. */
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard/playground");
      }
    });
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
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

    setTimeout(() => {
      router.push("/dashboard/playground");
      router.refresh();
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
          <h1 className="text-2xl font-serif font-bold text-foreground text-center mb-2">
            {inviteCode ? "Join your partner" : "Create your account"}
          </h1>
          <p className="text-sm text-muted text-center mb-6">
            {inviteCode
              ? "You've been invited to partner. Create your account to get started."
              : "Sign up to start building your creator app."}
          </p>

          <form onSubmit={handleSignUp} className="space-y-5">
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
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">{error}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating account…" : "Create account →"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  );
}
