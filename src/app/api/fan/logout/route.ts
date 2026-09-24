/**
 * Fan logout — Model B isolated logout (fan-shell.md Part 5). Accepts an
 * optional `creator_id`: when given, only THAT creator's token is removed from
 * the per-creator session map (other creators stay signed in); when omitted,
 * the entire fan session is cleared.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { clearFanSession } from "@/lib/fanSession";

export async function POST(request: NextRequest) {
  let creatorId: string | undefined;
  try {
    const body = (await request.json()) as { creator_id?: string };
    creatorId = body?.creator_id ?? undefined;
  } catch {
    // No body → full logout.
  }

  const supabase = createServiceClient();
  const response = NextResponse.json({ ok: true });
  await clearFanSession(response, supabase, creatorId, request.cookies);
  return response;
}