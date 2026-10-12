"use client";

/**
 * AffiliateSection (earnings.md §2) — money between you and your collabs,
 * two directions always split: "You earned" (others owe you) and "You owe"
 * (your sales' promoter cuts). Receipt rows carry the protocol actions —
 * Mark as paid / Confirm / Dispute (Part 3) — and the Red Card banner (Part 4).
 * Rewritten from the Network rail's EarningsSummary 2026-10-10.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, formatDate } from "@/lib/format";
import { fetchJson } from "@/lib/fetchJson";
import { formatDealRate } from "@/lib/affiliate-format";

interface Totals {
  settled: number;
  pending: number;
  disputed: number;
}

interface ReceiptDeal {
  deal_type: string;
  rate: number | null;
  trigger: string;
  custom_terms: string | null;
  status: string;
}

interface ReceiptRow {
  id: string;
  deal_id: string;
  promoter_cut: number;
  settlement_status: string;
  due_at: string | null;
  owner_paid_at: string | null;
  direction: "owed" | "earned";
  deal: ReceiptDeal | null;
  counterparty: {
    id: string;
    display_name: string | null;
    username: string | null;
    paypal_handle: string | null;
  } | null;
  sale: { amount_paid: number; currency: string } | null;
  held: boolean;
  ghost: boolean;
}

interface EarningsData {
  earned: Totals;
  owed: Totals;
  conversions: ReceiptRow[];
  red_card: { red: boolean; overdue: number; disputed: number };
  action_required: number;
  deal_count: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isOverdue(row: ReceiptRow): boolean {
  const due = row.due_at
    ? Date.parse(row.due_at)
    : Date.parse(String(row.owner_paid_at ?? "")) || Date.now() + DAY_MS;
  return due < Date.now();
}

function StatusChip({ row }: { row: ReceiptRow }) {
  const s = row.settlement_status;
  if (s === "settled") return <Badge variant="secondary">✅ Settled</Badge>;
  if (s === "disputed") return <Badge variant="outline" className="border-destructive/40 text-destructive">⚠️ Disputed</Badge>;
  if (s === "awaiting_confirm") {
    return row.ghost ? (
      <Badge variant="outline" className="border-destructive/40 text-destructive">🧑‍⚖️ Awaiting verdict</Badge>
    ) : (
      <Badge variant="secondary">👁 Awaiting confirm</Badge>
    );
  }
  if (row.held) return <Badge variant="secondary">⏸ On hold</Badge>;
  if (isOverdue(row)) return <Badge variant="outline" className="border-destructive/40 text-destructive">🟥 In arrears</Badge>;
  return <Badge variant="outline">⏳ Due {row.due_at ? formatDate(row.due_at) : ""}</Badge>;
}

function RedCardBanner({ overdue, disputed }: { overdue: number; disputed: number }) {
  const reasons: string[] = [];
  if (overdue > 0) reasons.push(`${overdue} payment${overdue === 1 ? "" : "s"} past due`);
  if (disputed > 0) reasons.push(`${disputed} dispute${disputed === 1 ? "" : "s"} open`);
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-2">
      <p className="font-semibold text-destructive">🟥 Red Card — {reasons.join(" · ")}</p>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• New affiliate deals are blocked, in any role.</li>
        <li>• Your active deals pause — no new conversions written.</li>
        <li>• Payments owed to you are held until you clear.</li>
      </ul>
      <p className="text-sm text-foreground">Paying what you owe clears it.</p>
    </div>
  );
}

function ReceiptRowView({
  row,
  onAction,
}: {
  row: ReceiptRow;
  onAction: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");

  const name = row.counterparty
    ? row.counterparty.display_name || row.counterparty.username || "Creator"
    : "Creator";
  const handle = row.counterparty?.username;

  const act = async (action: "mark_paid" | "confirm" | "dispute", extra?: { reason?: string }) => {
    setBusy(true);
    try {
      await fetchJson(`/api/creator/affiliates/conversions/${row.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      toast.success(
        action === "mark_paid"
          ? "Marked as paid — waiting for confirmation"
          : action === "confirm"
            ? "Payment confirmed — settled"
            : "Dispute filed — the platform owner will review",
      );
      setDisputing(false);
      setReason("");
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const payNow = () => {
    const h = row.counterparty?.paypal_handle;
    if (h) window.open(`https://paypal.me/${h}`, "_blank", "noopener,noreferrer");
    else
      toast.info(
        `${name} hasn't set a PayPal.me handle yet — ask them for it, then mark the payment as sent.`,
      );
  };

  return (
    <li className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {name}
            {handle && <span className="text-muted-foreground font-normal"> @{handle}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.deal ? formatDealRate(row.deal) : "Deal"} · on a sale of{" "}
            {row.sale ? money(row.sale.amount_paid, row.sale.currency) : money(row.promoter_cut)}
            {" · "}you {row.direction === "owed" ? "owe" : "receive"}{" "}
            <span className="font-medium text-foreground">{money(row.promoter_cut)}</span>
          </p>
        </div>
        <StatusChip row={row} />
      </div>

      {row.held && row.direction === "owed" && (
        <p className="text-xs text-muted-foreground">
          Hold this payment — releases automatically when {name} clears.
        </p>
      )}

      {/* Role-dependent actions (earnings.md Part 3) */}
      {row.direction === "owed" && row.settlement_status === "pending" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={payNow} disabled={busy || row.held}>
            Pay now
          </Button>
          <Button size="sm" onClick={() => act("mark_paid")} disabled={busy || row.held}>
            {busy ? "..." : "Mark as paid"}
          </Button>
        </div>
      )}

      {row.direction === "earned" && row.settlement_status === "awaiting_confirm" && !row.ghost && (
        <div className="space-y-2">
          {!disputing ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => act("confirm")} disabled={busy}>
                {busy ? "..." : "Confirm received"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDisputing(true)} disabled={busy}>
                Dispute
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                maxLength={500}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => act("dispute", { reason })} disabled={busy}>
                  {busy ? "..." : "File dispute"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDisputing(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function AffiliateSection({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toastOnce = useRef<Set<string>>(new Set());

  const load = useCallback(() => {
    return fetchJson<EarningsData>("/api/creator/affiliates/earnings")
      .then((d) => {
        setData(d);
        // Ladder notices that just fired — show each once per session.
        const flagged = d as EarningsData & { notices?: Array<{ stage: string; conversion_id: string; amount: number; who: string; role: string }> };
        for (const n of flagged.notices ?? []) {
          const key = `${n.stage}:${n.conversion_id}`;
          if (toastOnce.current.has(key)) continue;
          toastOnce.current.add(key);
          toast.info(
            n.role === "debtor"
              ? `You received ${money(n.amount)} — ${money(n.amount)} is owed to ${n.who}. Pay now`
              : `You earned ${money(n.amount)} on ${n.who}'s sale`,
          );
        }
      })
      .catch(() => setError("Could not load earnings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading earnings...</CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  const earned = data?.earned ?? { settled: 0, pending: 0, disputed: 0 };
  const owed = data?.owed ?? { settled: 0, pending: 0, disputed: 0 };
  const rows = data?.conversions ?? [];
  const earnedRows = rows.filter((r) => r.direction === "earned");
  const owedRows = rows.filter((r) => r.direction === "owed");
  const red = data?.red_card;

  // Mutual-debt hint (display-only, earnings.md Part 3) — per counterparty:
  // both directions open with the same person → "You owe each other — about $N net".
  const byCounterparty = new Map<string, { name: string; owed: number; earned: number }>();
  for (const r of rows) {
    if (!r.counterparty || r.settlement_status === "settled") continue;
    const cp = r.counterparty;
    const entry = byCounterparty.get(cp.id) ?? {
      name: cp.username ? `@${cp.username}` : (cp.display_name ?? "your partner"),
      owed: 0,
      earned: 0,
    };
    if (r.direction === "owed") entry.owed += r.promoter_cut;
    else entry.earned += r.promoter_cut;
    byCounterparty.set(cp.id, entry);
  }
  const mutualHints = [...byCounterparty.values()]
    .filter((m) => m.owed > 0 && m.earned > 0)
    .map((m) => ({ name: m.name, net: Math.abs(m.owed - m.earned) }));

  const openTotal = (t: Totals) => t.pending + t.disputed;

  return (
    <div className="space-y-4">
      {red?.red && <RedCardBanner overdue={red.overdue} disputed={red.disputed} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Affiliate earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {(data?.deal_count ?? 0) === 0 ? (
                <>No affiliate deals yet — create one with &quot;+ New deal&quot; below.</>
              ) : (
                "No conversions yet — share your partner's work."
              )}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* You earned */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">You earned</p>
              <p className="text-2xl font-bold text-green-600 truncate">{money(openTotal(earned))}</p>
              <p className="text-xs text-muted-foreground">
                open · {money(earned.settled)} settled
                {earned.disputed > 0 && ` · ${money(earned.disputed)} disputed`}
              </p>
              {mutualHints.map((h) => (
                <p key={`earned-${h.name}`} className="text-xs text-amber-600">
                  You owe each other — about {money(h.net)} net with {h.name}
                </p>
              ))}
              {earnedRows.length > 0 ? (
                <ul className="space-y-2">
                  {earnedRows.map((r) => (
                    <ReceiptRowView key={r.id} row={r} onAction={load} />
                  ))}
                </ul>
              ) : (
                rows.length > 0 && <p className="text-xs text-muted-foreground">Nothing owed to you.</p>
              )}
            </div>

            {/* You owe */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">You owe</p>
              <p className="text-2xl font-bold text-amber-600 truncate">{money(openTotal(owed))}</p>
              <p className="text-xs text-muted-foreground">
                open · {money(owed.settled)} settled
                {owed.disputed > 0 && ` · ${money(owed.disputed)} disputed`}
              </p>
              {mutualHints.map((h) => (
                <p key={`owed-${h.name}`} className="text-xs text-amber-600">
                  You owe each other — about {money(h.net)} net with {h.name}
                </p>
              ))}
              {owedRows.length > 0 ? (
                <ul className="space-y-2">
                  {owedRows.map((r) => (
                    <ReceiptRowView key={r.id} row={r} onAction={load} />
                  ))}
                </ul>
              ) : (
                rows.length > 0 && <p className="text-xs text-muted-foreground">Nothing owed by you.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
