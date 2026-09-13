/** type: component — Login form with email, password, submit. Used by the /login page. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      document.cookie = `mock_auth_uid=${data.user.id}; path=/; max-age=3600`;
      document.cookie = `mock_auth_email=${encodeURIComponent(data.user.email ?? "")}; path=/; max-age=3600`;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleLogin} className="text-left space-y-5">
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
  );
}
