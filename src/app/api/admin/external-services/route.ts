/**
 * External services API — returns the list of planned external services
 * with their access status for the current admin.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";
import { SERVICES } from "@/lib/services-config";
import type { AdminServiceAccess, ServiceId } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const serviceClient = (await import("@/lib/supabase/admin")).createServiceClient();
    const { data: accessRows } = await serviceClient
      .from("admin_service_access")
      .select("*")
      .eq("user_id", user.id);

    const accessMap = new Map<ServiceId, boolean>();
    for (const row of (accessRows as AdminServiceAccess[] | null) ?? []) {
      accessMap.set(row.service_id, row.enabled);
    }

    const services = SERVICES.map((s) => ({
      ...s,
      enabled: accessMap.get(s.id) ?? false,
    }));

    return NextResponse.json({ services, role: admin.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
