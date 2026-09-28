/**
 * GET /api/creator/peeps — My Peeps umbrella (relationships.md Part 1)
 * extended for the Network rebuild: partner/fan/staff counts plus the data the
 * floating dock badges need — pending collab requests, pending team invites,
 * and per-group unread chat totals (partners/fans/staff).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Counts ────────────────────────────────────────────────────────────────
    const [{ count: partners }, { count: fans }, { count: staff }] = await Promise.all([
      supabase
        .from("partnerships")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`),
      supabase
        .from("fan_accounts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", user.id),
      supabase
        .from("creator_team_members")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", user.id),
    ]);

    const { count: pendingRequests } = await supabase
      .from("partnerships")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("creator_b", user.id);

    const { count: pendingInvites } = await supabase
      .from("creator_team_invites")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString());

    // ── Per-group unread ───────────────────────────────────────────────────────
    // Classify each of my active direct conversations by the OTHER participant
    // (fans = fan_accounts of this creator, partners = non-ended partnership,
    // staff = team members), then COUNT messages newer than my last_read_at with
    // a server-side filtered query — never load full message history. Muted and
    // left conversations are excluded server-side. The dock polls this every 30s.
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("*")
      .eq("participant_key", me.key)
      .is("left_at", null);
    const active = (memberships ?? []).filter((m) => !m.muted_at);
    const unread = { partners: 0, fans: 0, staff: 0 };

    if (active.length > 0) {
      const convoIds = active.map((m) => m.conversation_id as string);

      const [{ data: convos }, { data: others }, { data: fansData }, { data: partnerships }, { data: teamRows }] =
        await Promise.all([
          supabase.from("conversations").select("id, type").in("id", convoIds).eq("type", "direct"),
          supabase
            .from("conversation_members")
            .select("conversation_id, participant_key")
            .in("conversation_id", convoIds)
            .neq("participant_key", me.key),
          supabase.from("fan_accounts").select("id").eq("creator_id", user.id),
          supabase
            .from("partnerships")
            .select("creator_a, creator_b")
            .neq("status", "ended")
            .or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`),
          supabase.from("creator_team_members").select("user_id").eq("creator_id", user.id),
        ]);

      const directIds = new Set((convos ?? []).map((c) => c.id as string));
      const otherByConvo = new Map<string, string>();
      for (const o of others ?? []) otherByConvo.set(o.conversation_id as string, o.participant_key as string);

      const fanIds = new Set((fansData ?? []).map((f) => f.id));
      const partnerIds = new Set<string>();
      for (const p of partnerships ?? []) {
        partnerIds.add(p.creator_a === user.id ? p.creator_b : p.creator_a);
      }
      const staffIds = new Set((teamRows ?? []).map((t) => t.user_id));

      const jobs: Promise<void>[] = [];
      for (const memberRow of active) {
        const convoId = memberRow.conversation_id as string;
        if (!directIds.has(convoId)) continue;
        const other = otherByConvo.get(convoId);
        if (!other) continue;
        const group = fanIds.has(other)
          ? "fans"
          : staffIds.has(other)
            ? "staff"
            : partnerIds.has(other)
              ? "partners"
              : null;
        if (!group) continue;

        jobs.push(
          (async () => {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", convoId)
              .neq("sender_key", me.key)
              .is("deleted_at", null)
              .gt("created_at", memberRow.last_read_at ?? "1970-01-01");
            unread[group] += count ?? 0;
          })(),
        );
      }
      await Promise.all(jobs);
    }

    return NextResponse.json({
      partners: partners ?? 0,
      fans: fans ?? 0,
      staff: staff ?? 0,
      pending_requests: pendingRequests ?? 0,
      pending_invites: pendingInvites ?? 0,
      unread,
    });
  } catch (err) {
    console.error("[relationships] GET:", err);
    return NextResponse.json({ error: "Failed to fetch relationships" }, { status: 500 });
  }
}