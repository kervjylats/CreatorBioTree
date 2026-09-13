/**
 * Partner data API — returns a partner creator's branding, catalog items,
 * and artist links as JSON. Used by the PartnerModal bottom-sheet which
 * runs client-side and needs a JSON endpoint (the guest page is server-rendered HTML).
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveFanShellData } from "@/lib/fanShellData";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const data = await resolveFanShellData(username);
  if (!data) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  return NextResponse.json({
    branding: data.branding,
    items: data.items,
    artistLinks: data.artistLinks,
  });
}
