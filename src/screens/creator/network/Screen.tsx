/** Network screen at /dashboard/network — 3-section anchored layout: left rail (Discover), center detail, right rail (My Peeps). */
import type { Metadata } from "next";
import { NetworkPage } from "@/components/network/NetworkPage";

export const metadata: Metadata = {
  title: "Network",
};

export default function NetworkScreen() {
  return (
    <main className="min-h-screen bg-background">
      <NetworkPage />
    </main>
  );
}
