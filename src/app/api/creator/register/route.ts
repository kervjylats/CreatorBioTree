/** Creator onboarding — sets Link Address (username) + display name on the creator row after signup (onboarding.md). */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const displayName = typeof body?.display_name === "string" ? body.display_name.trim() : "";

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Link address must be 3–20 lowercase letters, numbers, or underscores." },
      { status: 400 }
    );
  }

  if (!displayName) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }

  const { data: existing, error: checkError } = await supabase
    .from("creators")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (checkError) return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  if (existing) return NextResponse.json({ error: "That link address is already taken." }, { status: 409 });

  const { data: creator, error } = await supabase
    .from("creators")
    .upsert(
      {
        id: user.id,
        username,
        display_name: displayName,
        email: user.email,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error || !creator) {
    return NextResponse.json({ error: "Failed to create your account." }, { status: 500 });
  }

  return NextResponse.json({ creator });
}
