/**
 * StaffPage — /dashboard/network/staff content (network.md): pending team
 * invites, the member list with permission toggles, and the invite-by-email
 * form. Owner only.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { TeamRow } from "@/components/team/TeamRow";
import { InviteEmail } from "@/components/team/InviteEmail";
import { PermissionsToggles } from "@/components/team/PermissionsToggles";
import { ChatIcon } from "@/components/chat/ChatShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  permissions: Record<string, boolean>;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export function StaffPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, boolean> | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      fetch("/api/creator/team/members").then((r) => r.json()),
      fetch("/api/creator/team/invites").then((r) => r.json()),
    ])
      .then(([mData, iData]) => {
        setMembers(mData.members ?? []);
        setInvites(iData.invites ?? []);
      })
      .catch(() => { toast.error("Failed to load staff"); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSavePermissions = async () => {
    if (!editingId || !draft) return;
    const res = await fetch(`/api/creator/team/members/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: draft }),
    });
    if (res.ok) {
      toast.success("Permissions updated");
      setEditingId(null);
      setDraft(null);
      fetchAll();
    } else {
      toast.error("Failed to update permissions");
    }
  };

  const handleRemove = async (memberId: string) => {
    const res = await fetch(`/api/creator/team/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Member removed");
      fetchAll();
    } else {
      toast.error("Failed to remove member");
    }
  };

  const pendingInvites = invites.filter((i) => i.status !== "accepted");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team members and helpers with per-person permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invite a team member</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteEmail onInvited={fetchAll} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pending invites
            </h2>
            {pendingInvites.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pending invites.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{inv.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.role} · Invited {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Members
            </h2>
            {members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No team members yet.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <TeamRow
                        member={m}
                        onEdit={(id) => {
                          setEditingId(id);
                          setDraft(m.permissions);
                        }}
                        onRemove={handleRemove}
                      />
                    </div>
                    {m.user_id && (
                      <ChatIcon
                        otherKey={m.user_id}
                        otherParty="creator"
                        name={m.user?.display_name ?? m.user?.email ?? "Team member"}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {editingId && draft && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">Edit permissions</CardTitle>
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setDraft(null); }}
                  className="rounded-full p-1 hover:bg-accent"
                >
                  <X size={16} />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <PermissionsToggles permissions={draft} onChange={setDraft} />
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
                >
                  Save permissions
                </button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}