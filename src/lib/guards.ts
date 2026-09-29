/**
 * guards.ts — shared server-component guards (duplication audit 2026-09-29
 * trivial sweep). `hasCreatorSession()` = the already-logged-in check written
 * verbatim in the login + onboarding Screens (redirect target differs);
 * `redirectIfNotFan()` = the no-password render rule written in all 4 fan
 * tab Screens (fan-shell.md Part 5: Follower/visitor → /guest).
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

/** True when a creator session exists (mock cookie or Supabase auth user). */
export async function hasCreatorSession(): Promise<boolean> {
  if (USE_MOCKS) {
    const cookieStore = await cookies();
    return Boolean(cookieStore.get("mock_auth_uid")?.value);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

/** Fan-only render rule: bounce sessions without a password (visitors/followers) to /guest. */
export function redirectIfNotFan(username: string, identity: { hasPassword?: boolean } | null): void {
  if (!identity?.hasPassword) redirect(`/${username}/guest`);
}
