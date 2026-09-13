/** Fan logout — clears the fan_session cookie (fan-shell.md Part 5). */
import { NextRequest, NextResponse } from "next/server";
import { clearFanSession } from "@/lib/fanSession";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearFanSession(response);
  return response;
}