/** /onboarding screen — creator signup (onboarding.md): server-side already-logged-in redirect + ?invite= passthrough, renders AuthCard + OnboardingForm. Logged-in users with a valid ?invite= now CONSUME the partner invite (partnership.md "THE private-collab path", 2026-10-07) instead of dropping it. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { hasCreatorSession } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { consumePartnerInvite } from "@/lib/partnerInvites";

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

  if (await hasCreatorSession()) {
    // Logged-in + ?invite= = the private-collab path (partnership.md): consume the
    // code here — dropping it forced hidden creators to log out first (2026-10-07).
    if (inviteCode) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const result = await consumePartnerInvite(supabase, user.id, inviteCode).catch(
          () => null
        );
        if (result?.ok) {
          const name = result.partner.display_name || result.partner.username || "";
          redirect(
            `/dashboard/circle/partners?joined=${encodeURIComponent(name)}`
          );
        }
        redirect("/dashboard/circle/partners?invite_error=1");
      }
    }
    redirect("/dashboard/playground");
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