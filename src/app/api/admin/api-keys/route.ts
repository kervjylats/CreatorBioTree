/** API key generation for agent-tier automation. Creates a new admin_account with role=agent. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPerform, getAdminAccount } from "@/lib/admin-permissions";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_admins")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = `api_${crypto.randomUUID().replace(/-/g, "")}`;
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("admin_accounts")
      .insert({
        user_id: user.id,
        role: "agent",
        permissions: {},
        api_key: apiKey,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate API key" }, { status: 500 });
  }
}
