/**
 * GET /ref/[code] — the affiliate short link: count the click, record server-side
 * attribution (monetization/creators.md Part 2f — an affiliate_attributions row +
 * a handoff cookie), then redirect to the deal OWNER's fan page. The owner runs the
 * storefront being promoted; link.creator_id is the promoter (their click stats).
 * The conversion itself is written at purchase time (Part 2e2) — this is the funnel top.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { AFF_ATTRIBUTION_COOKIE, AFF_ATTRIBUTION_MAX_AGE } from "@/lib/affiliateAttribution";

// "My Links" hands creators a `/ref/<code>` URL to share, but nothing served it:
// the copied link 404'd and `click_count` was never incremented anywhere, so every
// link read "0 clicks" forever (2026-10-01 audit). This route makes the link real.
// Redirects stay on the incoming origin, so it works on localhost, a preview
// deployment and production without any host configuration.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("affiliate_links")
    .select("id, deal_id, click_count, active")
    .eq("ref_code", code)
    .maybeSingle();

  // Unknown or deactivated link: there is no creator to send them to, so go home
  // rather than reveal whether a code exists.
  if (!link || link.active === false) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await supabase
    .from("affiliate_links")
    .update({ click_count: Number(link.click_count ?? 0) + 1 })
    .eq("id", link.id);

  // The deal owner is whose storefront the link promotes (a promoter-created link
  // must NOT bounce the fan to the promoter's own page — the product lives with
  // the owner). Conversion scope checks later rely on this landing spot too.
  const { data: deal } = await supabase
    .from("affiliate_deals")
    .select("owner_id")
    .eq("id", link.deal_id)
    .maybeSingle();

  let ownerUsername: string | null = null;
  if (deal?.owner_id) {
    const { data: owner } = await supabase
      .from("creators")
      .select("username")
      .eq("id", deal.owner_id)
      .maybeSingle();
    ownerUsername = owner?.username ?? null;
  }

  if (!ownerUsername) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Attribution: one anonymous row per click — fan_id/item_id are backfilled when
  // a purchase happens (Part 2f). A failure here must not break the redirect; the
  // visit just goes unattributed (and earns no conversion, the conservative side).
  let attributionId: string | null = null;
  try {
    const { data: attribution, error } = await supabase
      .from("affiliate_attributions")
      .insert({
        ref_code: code,
        deal_id: link.deal_id,
        fan_id: null,
        item_id: null,
        attributed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    attributionId = attribution.id;
  } catch (err) {
    console.error("[ref] attribution insert failed:", err);
  }

  const response = NextResponse.redirect(new URL(`/${ownerUsername}`, req.url));
  if (attributionId) {
    response.cookies.set(AFF_ATTRIBUTION_COOKIE, attributionId, {
      maxAge: AFF_ATTRIBUTION_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

// PRODUCTION-NOTE: the counter is read-then-write, so two simultaneous clicks on
// the same link can lose one. Move it to an atomic `increment_ref_click(code)`
// SQL function at migration (the mock client's update path mirrors the effect).
// The cookie is only the browser-side handoff — production attribution should
// ALSO accept a persistent `?ref=` param passthrough (Part 2e: server-side is
// the source of truth; the cookie alone dies with cookie clearing).
