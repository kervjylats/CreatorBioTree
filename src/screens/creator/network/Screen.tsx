/** Network screen at /dashboard/network — Discover hub: 2-col at md+ (left rail = Billboard + Affiliates, center = Discover grid), single column below md. Dock pages live at /dashboard/circle/*. */
import type { Metadata } from "next";
import { NetworkPage } from "@/components/network/NetworkPage";

export const metadata: Metadata = {
  title: "Network",
};

export default function NetworkScreen() {
  return (
    <main className="min-h-screen-safe bg-background">
      <NetworkPage />
    </main>
  );
}
