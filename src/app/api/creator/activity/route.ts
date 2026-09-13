/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error: rpcError } = await supabase.rpc("get_creator_activity", {
      p_creator_id: user.id,
    });

    if (rpcError) {
      console.error("Activity RPC error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Activity API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
