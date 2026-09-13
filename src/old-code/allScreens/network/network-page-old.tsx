/** Network page — partner discovery and collaboration management. (OLD backup) */
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface NetworkCreator {
  id:           string;
  username:     string;
  display_name: string;
  bio:          string;
  avatar_url:   string;
}

interface Partnership {
  id:             string;
  creator_a:      string;
  creator_b:      string;
  status:         "pending" | "active" | "declined" | "ended";
  commission_pct: number;
  creator_a_info: NetworkCreator;
  creator_b_info: NetworkCreator;
}

interface PartnerStats {
  earned: number;
  owed:   number;
}

export default function NetworkPage() {
  const [activeTab, setActiveTab]    = useState<"find" | "my_collabs">("find");
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [stats, setStats]            = useState<PartnerStats | null>(null);
  const [loading, setLoading]        = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved]   = useState(false);

  const [modalCreator, setModalCreator] = useState<NetworkCreator | null>(null);
  const [connectCommission, setConnectCommission] = useState(10);
  const [connecting, setConnecting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const [creatorRes, partnershipsRes, statsRes] = await Promise.all([
      supabase
        .from("creators")
        .select("is_discoverable")
        .eq("id", user.id)
        .single(),
      fetch("/api/creator/partners")
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch("/api/creator/partners/stats")
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]);

    if (creatorRes.data) {
      setIsDiscoverable(creatorRes.data.is_discoverable ?? false);
    }
    if (Array.isArray(partnershipsRes)) setPartnerships(partnershipsRes);
    if (statsRes && !statsRes.error) setStats(statsRes);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    if (!currentUserId) return;
    setSavingSettings(true);
    try {
      const supabase = createClient();
      const { profileUpdateService } = await import("@/services/profileUpdateService");
      await profileUpdateService(supabase, currentUserId, { is_discoverable: isDiscoverable });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      loadData();
    } catch {
    } finally {
      setSavingSettings(false);
    }
  };

  const [acceptCommissions, setAcceptCommissions] = useState<Record<string, number>>({});
  const getAcceptCommission = (id: string, defaultVal: number) => acceptCommissions[id] ?? defaultVal;
  const setAcceptCommission = (id: string, val: number) => setAcceptCommissions(prev => ({ ...prev, [id]: val }));

  const handleConnect = async (targetId: string): Promise<boolean> => {
    if (connecting) return false;
    setConnecting(true);
    try {
      const res = await fetch("/api/creator/partners", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ target_creator_id: targetId, commission_pct: connectCommission }),
      });
      if (res.ok) { loadData(); return true; }
      return false;
    } catch {
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateStatus = async (partnershipId: string, status: string, commission_pct?: number) => {
    try {
      const body: Record<string, unknown> = { status };
      if (commission_pct !== undefined) body.commission_pct = commission_pct;
      const res = await fetch(`/api/creator/partners/${partnershipId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error("[Network] Status update failed:", err);
    }
  };

  const incoming = partnerships.filter(p => p.status === "pending" && p.creator_b === currentUserId);
  const outgoing = partnerships.filter(p => p.status === "pending" && p.creator_a === currentUserId);
  const active   = partnerships.filter(p => p.status === "active");

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading network…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Network</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect with other creators, run collabs, and grow together.
        </p>
      </header>

      <section className="rounded-3xl border border-[#E8E4DB] bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Your Network Settings</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Control whether other creators can find and invite you to partnerships.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-gray-900">Appear in partner search</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDiscoverable
                ? "Other creators can find and invite you."
                : "You are hidden from partner search. You can still send requests."}
            </p>
          </div>
          <Switch
            checked={isDiscoverable}
            onChange={setIsDiscoverable}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            size="default"
            styleColor="#5A6A4A"
          >
            {savingSettings ? "Saving…" : "Save settings"}
          </Button>
          {settingsSaved && (
            <span className="text-xs text-[#5A6A4A] font-medium">✓ Saved</span>
          )}
        </div>
      </section>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active collabs",   value: active.length },
            { label: "Pending",          value: incoming.length + outgoing.length },
            { label: "Earned from refs", value: `$${(stats.earned || 0).toFixed(2)}` },
            { label: "Owed to partners", value: `$${(stats.owed   || 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[#E8E4DB] bg-white p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* PartnerInviteCard was rendered here */}

      <div className="flex gap-1 border-b border-gray-200">
        {(["find", "my_collabs"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-[#5A6A4A] text-[#5A6A4A]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "find"
              ? `Requests (${incoming.length})`
              : `My Collabs (${active.length})`}
          </button>
        ))}
      </div>

      {activeTab === "find" && (
        <section className="space-y-4">
          {incoming.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                {incoming.length} incoming request{incoming.length > 1 ? "s" : ""}
              </p>
              {incoming.map(p => {
                const other = p.creator_a_info;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      {other.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{other.display_name || other.username}</p>
                        <p className="text-xs text-gray-400">@{other.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Comm:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={getAcceptCommission(p.id, p.commission_pct ?? 10)}
                          onChange={e => setAcceptCommission(p.id, Number(e.target.value))}
                          className="w-14 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-900 text-center"
                        />
                        <span>%</span>
                      </div>
                      <Button onClick={() => handleUpdateStatus(p.id, "active", getAcceptCommission(p.id, p.commission_pct ?? 10))}
                        size="sm" styleColor="#5A6A4A">
                        Accept
                      </Button>
                      <Button onClick={() => handleUpdateStatus(p.id, "declined")}
                        variant="outline" size="sm">
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
              No pending requests. Make sure you&apos;re discoverable so others can find you!
            </div>
          )}
        </section>
      )}

      {activeTab === "my_collabs" && (
        <section className="space-y-4">
          {outgoing.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Outgoing requests ({outgoing.length})
              </p>
              <div className="space-y-2">
                {outgoing.map(p => {
                  const other = p.creator_b_info;
                  return (
                    <div key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E8E4DB] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        {other.avatar_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{other.display_name || other.username}</p>
                          <p className="text-xs text-gray-400">@{other.username}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active.length === 0 && outgoing.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
              No active collabs yet.
            </div>
          ) : active.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Active collabs ({active.length})
              </p>
              <div className="space-y-2">
                {active.map(p => {
                  const other = p.creator_a === currentUserId ? p.creator_b_info : p.creator_a_info;
                  return (
                    <div key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E8E4DB] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        {other.avatar_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{other.display_name || other.username}</p>
                          <p className="text-xs text-gray-400">@{other.username}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                        Active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {modalCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalCreator(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 space-y-5">
            <button onClick={() => setModalCreator(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200">
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {modalCreator.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={modalCreator.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{modalCreator.display_name || modalCreator.username}</p>
                <p className="text-sm text-gray-400">@{modalCreator.username}</p>
              </div>
            </div>

            {modalCreator.bio && (
              <p className="text-sm text-gray-600 leading-relaxed">{modalCreator.bio}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Commission:</span>
                <input
                  type="number" min={0} max={100}
                  value={connectCommission}
                  onChange={e => setConnectCommission(Number(e.target.value))}
                  className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-900 text-center"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
              <Button
                onClick={async () => { const ok = await handleConnect(modalCreator.id); if (ok) setModalCreator(null); }}
                size="default"
                styleColor="#5A6A4A"
                className="w-full"
              >
                Send Partnership Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
