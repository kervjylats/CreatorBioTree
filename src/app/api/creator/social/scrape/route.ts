/** UNWIRED 503 stub — kept for rebuild. Old code: src/old-code/integrations/social-scrape-route-old.ts */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Social scrape is unwired. See wiredLater/integrations/social-scrape-route-old.ts" },
    { status: 503 }
  );
}
