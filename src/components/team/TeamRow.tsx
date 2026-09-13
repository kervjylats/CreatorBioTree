/** TODO: Add purpose docstring. */
/**
 * Team member row showing avatar, name, email, role, permissions count,
 * with edit and remove buttons (team.md Part 4).
 */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface TeamRowProps {
  member: {
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
  };
  onEdit: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

const PERMISSION_LABELS: Record<string, string> = {
  content: "Content",
  stats: "Overview & Stats",
  relationships: "Relationships",
  messages: "Messages",
  community: "Community",
  network: "Network",
  settings: "Settings",
  money: "Money",
};

/** Row showing avatar/name/email/role/permissions count with edit and remove buttons (team.md Part 4). */
export function TeamRow({ member, onEdit, onRemove }: TeamRowProps) {
  const grantedCount = Object.values(member.permissions).filter(Boolean).length;
  const totalPermissions = Object.keys(PERMISSION_LABELS).length;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {(member.user?.display_name ?? member.user?.email ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium">
            {member.user?.display_name ?? "Team member"}
          </div>
          <div className="text-xs text-muted-foreground">
            {member.user?.email ?? "—"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {grantedCount}/{totalPermissions}
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => onEdit(member.id)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(member.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
