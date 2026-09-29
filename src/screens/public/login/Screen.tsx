/** /login screen — creator/staff gateway (login.md): server-side next-path validation + logged-in redirect, renders AuthCard + LoginForm. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { hasCreatorSession } from "@/lib/guards";

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

  if (await hasCreatorSession()) {
    redirect("/dashboard");
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