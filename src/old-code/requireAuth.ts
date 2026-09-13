/** Auth guards for API routes — requireAuth() returns user or 401, requireAdmin() returns admin or 403. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    throw new AuthError("Unauthorized");
  }
  return { user, supabase };
}

export async function requireAdmin(permission?: string) {
  const { user, supabase } = await requireAuth();
  const supabaseServer = await createClient();
  const { data: adminAccount } = await supabaseServer
    .from("admin_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminAccount) {
    throw new AuthError("Forbidden");
  }

  if (permission) {
    const { canPerform } = await import("@/lib/admin-permissions");
    if (!canPerform(adminAccount as any, permission)) {
      throw new AuthError("Forbidden");
    }
  }

  return { user, supabase, adminAccount };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    const status = error.message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }
  return null;
}
