/**
 * GET /ref/[code] — the affiliate short link: count the click, then redirect to
 * the link owner's fan page. Conversions are attributed server-side at purchase
 * time (monetization/creators.md Part 2e2); this is the top of the funnel.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

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
    .select("id, creator_id, click_count, active")
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

  const { data: creator } = await supabase
    .from("creators")
    .select("username")
    .eq("id", link.creator_id)
    .maybeSingle();

  if (!creator?.username) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.redirect(new URL(`/${creator.username}`, req.url));
}

// PRODUCTION-NOTE: the counter is read-then-write, so two simultaneous clicks on
// the same link can lose one. Move it to an atomic `increment_ref_click(code)`
// SQL function at migration (the mock client's update path mirrors the effect).
