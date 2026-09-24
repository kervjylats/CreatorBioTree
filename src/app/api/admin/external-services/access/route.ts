/**
 * Service access API — GET returns the full access matrix (all admins × all
 * services), PATCH toggles a specific admin's access to a service.
 * Super_admin only.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPerform, getAdminAccount } from "@/lib/admin-permissions";
import { createServiceClient } from "@/lib/supabase/admin";
import type { AdminServiceAccess, AdminAccount } from "@/types";
import { ALL_SERVICE_IDS } from "@/lib/services-config";

const VALID_SERVICES = ALL_SERVICE_IDS;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_service_access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { data: accounts } = await serviceClient
      .from("admin_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: accessRows } = await serviceClient
      .from("admin_service_access")
      .select("*");

    const access = (accessRows as AdminServiceAccess[]) ?? [];
    const accountsList = (accounts as AdminAccount[]) ?? [];

    const matrix = accountsList.map((a) => {
      const services = Object.fromEntries(
        VALID_SERVICES.map((sid) => [
          sid,
          access.find((r) => r.user_id === a.user_id && r.service_id === sid)?.enabled ?? false,
        ])
      );
      return { user_id: a.user_id, role: a.role, services };
    });

    return NextResponse.json(matrix);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_service_access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id, service_id, enabled } = await req.json();
    if (!user_id || !service_id || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "user_id, service_id, and enabled (boolean) are required" }, { status: 400 });
    }
    if (!VALID_SERVICES.includes(service_id)) {
      return NextResponse.json({ error: "Invalid service_id" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: existing } = await serviceClient
      .from("admin_service_access")
      .select("id")
      .eq("user_id", user_id)
      .eq("service_id", service_id)
      .maybeSingle();

    if (existing) {
      const { error } = await serviceClient
        .from("admin_service_access")
        .update({ enabled })
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await serviceClient
        .from("admin_service_access")
        .insert({ user_id, service_id, enabled });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
