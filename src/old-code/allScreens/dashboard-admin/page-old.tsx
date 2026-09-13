/** Admin dashboard — tabbed UI: Overview (stats + creators), Admins (RBAC management), API Keys. */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CreatorFanModal } from "@/components/creator-dashboard/FanStatsCard";
import { Button } from "@/components/ui/button";

interface AdminStats {
  totalCreators: number;
  totalFans: number;
  totalItems: number;
  totalRevenue: number;
}

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  plan: string;
  is_featured: boolean;
  created_at: string;
  fan_count?: number;
}

interface AdminAccountRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

type AdminTab = "overview" | "admins" | "api-keys";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
        <p className="text-sm text-gray-500">Global overview and creator management.</p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(["overview", "admins", "api-keys"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "overview" ? "Overview" : t === "admins" ? "Admins" : "API Keys"}
          </button>
        ))}
      </div>

      {tab === "overview" && <AdminOverview />}
      {tab === "admins" && <AdminManage />}
      {tab === "api-keys" && <AdminApiKeys />}
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "fans" | "date">("date");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/creators"),
      ]);
      if (sRes.status === 403 || cRes.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      const sData = await sRes.json();
      const cData = await cRes.json();
      if (!cRes.ok) {
        console.error("Admin Creator API Error:", cData);
        setLoading(false);
        return;
      }
      setStats(sData);
      setCreators(cData as Creator[]);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleFeatured = async (creatorId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/creators/${creatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: !current }),
      });
      if (res.ok) loadData();
    } catch {
      console.error("Failed to update");
    }
  };

  const filteredCreators = [...creators].sort((a, b) => {
    if (sortBy === "name")
      return (a.display_name || a.username).localeCompare(b.display_name || b.username);
    if (sortBy === "fans") return (b.fan_count ?? 0) - (a.fan_count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading admin panel…</div>;
  }

  if (forbidden) {
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied: Admin Only.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Creators", value: stats?.totalCreators, icon: "👤" },
          { label: "Total Fans", value: stats?.totalFans, icon: "🙌" },
          { label: "Content Items", value: stats?.totalItems, icon: "📦" },
          { label: "Total Revenue", value: stats ? `$${stats.totalRevenue.toFixed(2)}` : "...", icon: "💰" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value ?? "..."}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Sort:</span>
        {(["date", "name", "fans"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            disabled={loading}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-opacity ${
              sortBy === key
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                : "text-gray-500 hover:bg-gray-100"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {key === "date" ? "Date" : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Creators</h2>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fans</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCreators.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        {c.avatar_url ? (
                          <Image src={c.avatar_url} alt="" width={32} height={32} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (c.display_name || c.username || "?")[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{c.display_name || `@${c.username}`}</div>
                        <div className="text-[10px] text-gray-400">Joined {new Date(c.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {c.is_featured ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">FEATURED</span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold">STANDARD</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedCreator(c)} className="font-bold text-indigo-600 hover:underline">
                      {c.fan_count ?? 0}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => toggleFeatured(c.id, c.is_featured)} variant="outline" size="sm">
                      {c.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCreator && (
        <CreatorFanModal
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.display_name || selectedCreator.username}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </div>
  );
}

function AdminManage() {
  const [admins, setAdmins] = useState<AdminAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support_admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAdmins = async () => {
    try {
      const res = await fetch("/api/admin/accounts");
      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    if (!email) { setError("Email is required"); return; }
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        setSuccess("Admin added");
        setEmail("");
        loadAdmins();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add admin");
      }
    } catch { setError("Failed to add admin"); }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
      loadAdmins();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Admin</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="super_admin">Super Admin</option>
              <option value="support_admin">Support Admin</option>
              <option value="content_admin">Content Admin</option>
              <option value="agent">Agent (API)</option>
            </select>
          </div>
          <Button onClick={handleAdd} size="sm">Add</Button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Admin Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{a.user_id}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      a.role === "super_admin" ? "bg-red-100 text-red-700" :
                      a.role === "support_admin" ? "bg-blue-100 text-blue-700" :
                      a.role === "content_admin" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {a.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => handleRemove(a.id)} variant="outline" size="sm" className="text-red-500">
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No admin accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminApiKeys() {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const generateKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setKey(data.api_key || "Generated");
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">AI Agent API Keys</h2>
      <p className="text-xs text-gray-500">Generate API keys for AI agents to access read-only platform stats.</p>
      <Button onClick={generateKey} disabled={loading} size="sm">
        {loading ? "Generating..." : "Generate New Key"}
      </Button>
      {key && (
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500 mb-1">Your new API key (copy it now — it won't be shown again):</p>
          <code className="text-sm font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 block break-all">{key}</code>
        </div>
      )}
    </section>
  );
}
