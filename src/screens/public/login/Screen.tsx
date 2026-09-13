/** /login screen — creator/staff gateway (login.md): server-side next-path validation + logged-in redirect, renders AuthCard + LoginForm. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

export const metadata: Metadata = {
  title: "Log in",
};

function isInternalPath(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default async function LoginScreen({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (USE_MOCKS) {
    const cookieStore = await cookies();
    if (cookieStore.get("mock_auth_uid")?.value) {
      redirect("/dashboard");
    }
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <AuthCard
      title="Welcome to BioTree"
      subtitle="Sign in to access your creator control room and manage your links."
    >
      <LoginForm next={isInternalPath(next)} />
    </AuthCard>
  );
}