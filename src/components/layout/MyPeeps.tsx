/**
 * My Peeps dock — three navigation icon buttons (Partners / Fans / Staff) with
 * red count badges. POSITION-LESS: the mount site (shell layout's floating stack)
 * owns placement — this component renders only the button group. Hidden entirely
 * on /admin. Uniform h-11 w-11 circles at every breakpoint (matches the chat
 * bubble that sits below it in the stack).
 */
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Users, Heart, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface Counts {
  partners: number;
  fans: number;
  staff: number;
  pending_requests: number;
  pending_invites: number;
  unread: { partners: number; fans: number; staff: number };
}

/** Combined badge math: partners = pending collab requests + partner unread; fans = fan unread; staff = pending invites + staff unread. */
function badgeFor(key: "partners" | "fans" | "staff", c: Counts): number {
  if (key === "partners") return (c.pending_requests ?? 0) + (c.unread?.partners ?? 0);
  if (key === "fans") return c.unread?.fans ?? 0;
  return (c.pending_invites ?? 0) + (c.unread?.staff ?? 0);
}

/** My Peeps — position-less Partners/Fans/Staff icon buttons with counts (mounted in the shell layout's floating row). */
export function MyPeeps() {
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>(() => ({
    partners: 0,
    fans: 0,
    staff: 0,
    pending_requests: 0,
    pending_invites: 0,
    unread: { partners: 0, fans: 0, staff: 0 },
  }));

  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    const fetchCounts = () => {
      fetch("/api/creator/relationships")
        .then((r) => r.json())
        .then((data) => {
          if (data.partners !== undefined) setCounts(data);
        })
        .catch(() => { toast.error("Failed to load counts"); });
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 30000);
    return () => clearInterval(id);
  }, []);

  const rows = [
    { key: "partners" as const, label: "Partners", icon: Users, href: "/dashboard/circle/partners" },
    { key: "fans" as const, label: "Fans", icon: Heart, href: "/dashboard/circle/fans" },
    { key: "staff" as const, label: "Staff", icon: Briefcase, href: "/dashboard/circle/staff" },
  ];

  return (
    <>
      {(!isAdmin ? rows : []).map((row) => {
        const active = pathname?.startsWith(row.href) ?? false;
        const badge = badgeFor(row.key, counts);
        return (
          <button
            key={row.key}
            type="button"
            aria-label={`My Peeps — ${row.label}`}
            title={row.label}
            onClick={() => router.push(row.href)}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border font-medium transition-colors ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground shadow-lg hover:bg-accent"
            }`}
          >
            <row.icon size={17} strokeWidth={active ? 2.5 : 2} />
            {badge > 0 && !active && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-caption font-bold text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}