/**
 * Staff member row showing avatar, name, email, role, permissions count,
 * with edit and remove buttons (staff.md Part 4).
 * Permission labels live in src/lib/staff-permissions.ts.
 */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { STAFF_PERMISSION_LABELS } from "@/lib/staff-permissions";

interface StaffRowProps {
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

/** Row showing avatar/name/email/role/permissions count with edit and remove buttons (staff.md Part 4). */
export function StaffRow({ member, onEdit, onRemove }: StaffRowProps) {
  const grantedCount = Object.values(member.permissions).filter(Boolean).length;
  const totalPermissions = Object.keys(STAFF_PERMISSION_LABELS).length;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {(member.user?.display_name ?? member.user?.email ?? "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {member.user?.display_name ?? "Staff member"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {member.user?.email ?? "—"}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
