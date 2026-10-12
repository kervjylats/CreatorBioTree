/**
 * POST /api/fan/hop — the silent in-app affiliate hop (fan-shell.md Part 4c,
 * earnings.md Part 8). A fan opens a partner surface from a host page (partner
 * modal / partner page): if an ACTIVE deal has owner = partner AND promoter =
 * host, record one affiliate_attributions row (ref_code "hop") and hand over
 * the 30-day aff_attr cookie — the same handoff /ref uses. No deal → 200
 * { tagged: false }: a hop NEVER breaks navigation. Anonymous + best-effort.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { AFF_ATTRIBUTION_COOKIE, AFF_ATTRIBUTION_MAX_AGE } from "@/lib/affiliateAttribution";
import { USERNAME_PATTERN } from "@/lib/username";

const hopSchema = z.object({
  host: z.string().regex(USERNAME_PATTERN),
  partner: z.string().regex(USERNAME_PATTERN),
});

export async function POST(request: NextRequest) {
  try {
    const tooMany = await enforceRateLimit(request, "fan-hop", 60, 60_000);
    if (tooMany) return tooMany;

    const body = await request.json();
    const validation = hopSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ tagged: false });

    const { host, partner } = validation.data;
    const supabase = createServiceClient();

    const { data: hostRow } = await supabase
      .from("creators")
      .select("id")
      .eq("username", host)
      .maybeSingle();
    const { data: partnerRow } = await supabase
      .from("creators")
      .select("id")
      .eq("username", partner)
      .maybeSingle();
    if (!hostRow?.id || !partnerRow?.id) return NextResponse.json({ tagged: false });

    // The hop credits the HOST (the page the fan came FROM) as promoter on the
    // PARTNER's storefront — only a real deal between them tags anything.
    const { data: deal } = await supabase
      .from("affiliate_deals")
      .select("id")
      .eq("owner_id", partnerRow.id)
      .eq("promoter_id", hostRow.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!deal?.id) return NextResponse.json({ tagged: false });

    const response = NextResponse.json({ tagged: true });

    // Best-effort: a failed attribution just means the hop goes uncredited.
    try {
      const { data: attribution } = await supabase
        .from("affiliate_attributions")
        .insert({
          ref_code: "hop",
          deal_id: deal.id,
          fan_id: null,
          item_id: null,
          attributed_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (attribution?.id) {
        response.cookies.set(AFF_ATTRIBUTION_COOKIE, attribution.id, {
          maxAge: AFF_ATTRIBUTION_MAX_AGE,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    } catch (err) {
      console.error("[fan/hop] attribution insert failed:", err);
    }

    return response;
  } catch {
    // Never break navigation — an untracked hop is the conservative default.
    return NextResponse.json({ tagged: false });
  }
}
