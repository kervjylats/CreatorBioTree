/**
 * Overview moved to `/dashboard` (founder decision 2026-09-30: one canonical
 * link for the Overview screen, matching the layout's own address). This 6-line
 * signpost keeps old links working — bookmarks, already-open tabs, and `?next=`
 * bounces from src/proxy.ts.
 */
import { redirect } from "next/navigation";

export default function OverviewMovedPage() {
  redirect("/dashboard");
}
