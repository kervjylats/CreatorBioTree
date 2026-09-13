/** UNWIRED — see wiredLater/integrations/social-scrape-route-old.ts. Rebuilding from spec. */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Social scrape is unwired. See wiredLater/integrations/social-scrape-route-old.ts" },
    { status: 503 }
  );
}
