/**
 * ExternalServicesPanel — shows all planned external services as cards.
 * Each card links to the service dashboard (opens in new tab).
 * Super admins see a "Manage Access" button to control per-admin visibility.
 */
"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { fetchJson } from "@/lib/fetchJson";
import { SERVICE_CATEGORY_COLORS } from "@/lib/services-config";
import { ServiceAccessDialog } from "@/components/admin/ServiceAccessDialog";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  enabled: boolean;
}

export function ExternalServicesPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchJson<{ services?: Service[]; role?: string }>("/api/admin/external-services")
      .then((data) => {
        setServices(data.services ?? []);
        setRole(data.role ?? "");
      })
      .catch(() => {
        toast.error("Failed to load services");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={20} />
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No services configured</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">External Services</h3>
        {role === "super_admin" && (
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Settings size={14} />
              Manage Access
            </Button>
            <ServiceAccessDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <a
            key={s.id}
            href={s.enabled ? s.url : "#"}
            target={s.enabled ? "_blank" : undefined}
            rel={s.enabled ? "noopener noreferrer" : undefined}
            className={`group flex flex-col rounded-xl border border-border p-4 transition-colors ${
              s.enabled
                ? "hover:border-accent/50 hover:bg-accent/5"
                : "cursor-default opacity-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${SERVICE_CATEGORY_COLORS[s.category] ?? "bg-muted text-muted-foreground"}`}>
                  {s.category}
                </span>
              </div>
              {s.enabled && (
                <ExternalLink size={14} className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
            <div className="mt-auto pt-3">
              {s.enabled ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  No access
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
