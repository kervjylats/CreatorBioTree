/**
 * GET /api/creator/relationships — My Peeps umbrella (relationships.md Part 1)
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
    // Classify each of my active direct conversations by the OTHER participant:
    // fans (fan_accounts of this creator), partners (any non-ended partnership),
    // staff (team members). Sum messages newer than my last_read_at, skip muted.
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("*")
      .eq("participant_key", me.key);
    const active = (memberships ?? []).filter((m) => !m.left_at);
    const unread = { partners: 0, fans: 0, staff: 0 };

    if (active.length > 0) {
      const convoIds = active.map((m) => m.conversation_id as string);
      const [{ data: convos }, { data: allMembers }, { data: messages }] = await Promise.all([
        supabase.from("conversations").select("id, type").in("id", convoIds),
        supabase.from("conversation_members").select("*").in("conversation_id", convoIds),
        supabase
          .from("messages")
          .select("conversation_id, sender_key, created_at, deleted_at")
          .in("conversation_id", convoIds),
      ]);

      // Sets for classification
      const { data: fansData } = await supabase
        .from("fan_accounts")
        .select("id")
        .eq("creator_id", user.id);
      const fanIds = new Set((fansData ?? []).map((f) => f.id));

      const { data: partnerships } = await supabase
        .from("partnerships")
        .select("creator_a, creator_b")
        .neq("status", "ended")
        .or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`);
      const partnerIds = new Set<string>();
      for (const p of partnerships ?? []) {
        partnerIds.add(p.creator_a === user.id ? p.creator_b : p.creator_a);
      }

      const { data: teamRows } = await supabase
        .from("creator_team_members")
        .select("user_id")
        .eq("creator_id", user.id);
      const staffIds = new Set((teamRows ?? []).map((t) => t.user_id));

      for (const convo of (convos ?? [])) {
        if (convo.type !== "direct") continue;
        const memberRow = active.find((m) => m.conversation_id === convo.id);
        if (!memberRow) continue;
        if (memberRow.muted_at) continue;

        const other = (allMembers ?? []).find(
          (m) => m.conversation_id === convo.id && m.participant_key !== me.key,
        );
        if (!other) continue;

        const unreadCount = (messages ?? [])
          .filter(
            (m) =>
              m.conversation_id === convo.id &&
              !m.deleted_at &&
              m.sender_key !== me.key &&
              String(m.created_at) > (memberRow.last_read_at ?? "1970-01-01"),
          ).length;
        if (unreadCount === 0) continue;

        if (fanIds.has(other.participant_key as string)) {
          unread.fans += unreadCount;
        } else if (staffIds.has(other.participant_key as string)) {
          unread.staff += unreadCount;
        } else if (partnerIds.has(other.participant_key as string)) {
          unread.partners += unreadCount;
        }
      }
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