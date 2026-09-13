/** /onboarding screen — creator signup (onboarding.md): server-side already-logged-in redirect + ?invite= passthrough, renders AuthCard + OnboardingForm. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AuthCard } from "@/components/auth/AuthCard";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

export const metadata: Metadata = {
  title: "Create your page",
};

function sanitizeInviteCode(invite: string | undefined): string | undefined {
  if (!invite) return undefined;
  const trimmed = invite.trim();
  if (trimmed.length > 100) return undefined;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : undefined;
}

export default async function OnboardingScreen({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const inviteCode = sanitizeInviteCode(invite);

  if (USE_MOCKS) {
    const cookieStore = await cookies();
    if (cookieStore.get("mock_auth_uid")?.value) {
      redirect("/dashboard/my-app");
    }
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard/my-app");
    }
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "creatorpwa.app";

  return (
    <AuthCard
      title={inviteCode ? "Join your partner" : "Create your account"}
      subtitle={
        inviteCode
          ? "You've been invited to partner. Create your account to get started."
          : "Sign up to start building your creator app."
      }
    >
      <OnboardingForm inviteCode={inviteCode} rootDomain={rootDomain} />
    </AuthCard>
  );
}