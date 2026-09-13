/** Admin accounts API — list all admins (GET) and create new admins (POST). Super_admin only. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPerform, getAdminAccount } from "@/lib/admin-permissions";
import { createServiceClient } from "@/lib/supabase/admin";
import type { AdminAccount } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_admins")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("admin_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_admins")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    const validRoles = ["super_admin", "support_admin", "content_admin", "agent"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { USE_MOCKS } = await import("@/lib/mocks/useMocks");
    const { data: creatorData, error: lookupErr } = await serviceClient
      .from("creators")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (lookupErr) {
      console.error("[admin/accounts POST] creator lookup error:", lookupErr);
    }

    let creator = creatorData;
    if (!creator) {
      if (USE_MOCKS) {
        const { v4: uuid } = await import("uuid");
        const newId = uuid();
        const now = new Date().toISOString();
        await serviceClient.from("creators").insert({
          id: newId,
          username: null,
          display_name: email.split("@")[0],
          email: email.toLowerCase(),
          role: "creator",
          created_at: now,
          updated_at: now,
        });
        creator = { id: newId };
      } else {
        return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
      }
    }

    const { data, error } = await serviceClient
      .from("admin_accounts")
      .insert({
        user_id: creator.id,
        role,
        permissions: {},
        api_key: role === "agent" ? `api_${crypto.randomUUID().replace(/-/g, "")}` : null,
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/accounts POST] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("[admin/accounts POST] success:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
