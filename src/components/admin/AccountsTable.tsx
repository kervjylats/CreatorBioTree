/**
 * AdminAccountsTable — staff admin accounts management (admin.md Part 3).
 * Lists all admin accounts, supports invite (POST), role edit (PATCH), and
 * revoke (DELETE). Fetches from GET /api/admin/accounts.
 */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminAccount, AdminRole } from "@/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  content_admin: "Content Admin",
  agent: "Agent",
};

export function AccountsTable() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("support_admin");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("support_admin");

  const fetchAccounts = () => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      console.log("[admin invite] response status:", res.status);
      if (!res.ok) {
        const err = await res.json();
        console.error("[admin invite] error:", err);
        setInviteError(err.error || "Failed to invite staff");
        return;
      }
      toast.success("Staff member invited");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("support_admin");
      fetchAccounts();
    } catch (e) {
      console.error("[admin invite] fetch error:", e);
      setInviteError("Failed to invite staff");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        toast.error("Failed to update role");
        return;
      }
      toast.success("Role updated");
      setEditingId(null);
      fetchAccounts();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to revoke access");
        return;
      }
      toast.success("Access revoked");
      fetchAccounts();
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Staff Accounts</h3>
        <Button size="sm" onClick={() => { setInviteError(""); setInviteOpen(true); }}>
          <Plus size={14} />
          Invite staff
        </Button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No staff accounts yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2.5">User ID</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">API Key</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{a.user_id}</td>
                  <td className="px-4 py-2.5">
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={editRole} onValueChange={(v) => setEditRole(v as AdminRole)}>
                          <SelectTrigger className="h-7 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => void handleRoleUpdate(a.id)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {ROLE_LABELS[a.role] ?? a.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {a.api_key ? `${a.api_key.slice(0, 12)}...` : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(a.id);
                          setEditRole(a.role);
                        }}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="destructive"
                        onClick={() => void handleRevoke(a.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              label="Email"
              type="email"
              placeholder="staff@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-widest">
                Role
              </label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AdminRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleInvite()} disabled={inviteLoading || !inviteEmail.trim()}>
              {inviteLoading ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
