/**
 * ServiceAccessDialog — super_admin only dialog to toggle which external
 * services each staff admin can access. Shows a matrix of admins × services
 * with on/off switches. Controlled via open/onOpenChange props from parent.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/Spinner";
import type { AdminRole, ServiceId } from "@/types";
import { SERVICE_LABELS, ALL_SERVICE_IDS } from "@/lib/services-config";
import { fetchJson } from "@/lib/fetchJson";
import { ROLE_LABELS } from "@/lib/admin-permissions";

interface AccessRow {
  user_id: string;
  role: AdminRole;
  services: Record<ServiceId, boolean>;
}

interface ServiceAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceAccessDialog({ open, onOpenChange }: ServiceAccessDialogProps) {
  const [matrix, setMatrix] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchMatrix = () => {
    fetchJson<unknown>("/api/admin/external-services/access")
      .then((data) => setMatrix(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error("Failed to load access matrix");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchMatrix();
    }
  }, [open]);

  const handleToggle = async (userId: string, serviceId: ServiceId, current: boolean) => {
    const key = `${userId}-${serviceId}`;
    setToggling(key);
    try {
      const res = await fetch("/api/admin/external-services/access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, service_id: serviceId, enabled: !current }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update access");
        return;
      }
      setMatrix((prev) =>
        prev.map((row) =>
          row.user_id === userId
            ? { ...row, services: { ...row.services, [serviceId]: !current } }
            : row,
        ),
      );
      toast.success("Access updated");
    } catch {
      toast.error("Failed to update access");
    } finally {
      setToggling(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Service Access</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={20} />
          </div>
        ) : matrix.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No admin accounts found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Admin</th>
                  {ALL_SERVICE_IDS.map((sid) => (
                    <th key={sid} className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">
                      {SERVICE_LABELS[sid]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.user_id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground">{row.user_id.slice(0, 12)}...</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        {ROLE_LABELS[row.role] ?? row.role}
                      </span>
                    </td>
                    {ALL_SERVICE_IDS.map((sid) => {
                      const isSuper = row.role === "super_admin";
                      const key = `${row.user_id}-${sid}`;
                      return (
                        <td key={sid} className="px-3 py-2.5 text-center">
                          <Switch
                            size="sm"
                            checked={row.services[sid]}
                            disabled={isSuper || toggling === key}
                            onChange={() => void handleToggle(row.user_id, sid, row.services[sid])}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Super admins always have access to all services. Toggling is disabled for super admins.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
