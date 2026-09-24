/**
 * List all non-ended partnerships for the authenticated creator (active collabs
 * + invited partners + pending requests), each with a computed direction:
 * "incoming" when the other creator requested us, "outgoing" when we requested them.
 */
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: mine } = await supabase
      .from("partnerships")
      .select("*")
      .neq("status", "ended")
      .or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`);

    const partnerIds = (mine ?? []).map((p) =>
      p.creator_a === user.id ? p.creator_b : p.creator_a,
    );

    let partnerMap = new Map<string, { id: string; username: string | null; display_name: string | null; avatar_url: string | null; tagline: string | null }>();
    if (partnerIds.length > 0) {
      const { data: partnerCreators } = await supabase
        .from("creators")
        .select("id, username, display_name, avatar_url, tagline")
        .in("id", partnerIds);
      partnerMap = new Map((partnerCreators ?? []).map((c) => [c.id, c]));
    }

    const enriched = (mine ?? []).map((p) => {
      const partnerId = p.creator_a === user.id ? p.creator_b : p.creator_a;
      const partner = partnerMap.get(partnerId);
      return {
        ...p,
        direction: p.creator_b === user.id ? ("incoming" as const) : ("outgoing" as const),
        partner_info: partner
          ? {
              id: partner.id,
              username: partner.username,
              display_name: partner.display_name,
              avatar_url: partner.avatar_url,
              tagline: partner.tagline,
            }
          : null,
      };
    });

    return NextResponse.json({ partnerships: enriched });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
