/**
 * ApiKeysPanel — API key generation for agent-tier automation (admin.md).
 * Shows existing agent-role keys and provides a "Generate Key" button that
 * POSTs to /api/admin/api-keys.
 */
"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminAccount } from "@/types";

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setKeys(list.filter((a: AdminAccount) => a.role === "agent"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/api-keys", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to generate key");
        return;
      }
      const newKey = await res.json();
      toast.success("API key generated");
      setKeys((prev) => [...prev, newKey]);
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      toast.success("Key copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
        <Button size="sm" onClick={() => void handleGenerate()} disabled={generating}>
          <Plus size={14} />
          {generating ? "Generating..." : "Generate Key"}
        </Button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading keys...</p>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No API keys yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate a key to enable agent-tier automation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-mono text-xs text-foreground">
                  {k.api_key ?? "no key"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(k.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => void copyKey(k.api_key ?? "", k.id)}
              >
                {copiedId === k.id ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
