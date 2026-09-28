/** Partners screen at /dashboard/circle/partners — requests, active collabs, invite card (network.md). */
import type { Metadata } from "next";
import { PartnersPage } from "@/components/circle/partners/PartnersPage";

export const metadata: Metadata = {
  title: "Partners",
};

export default function PartnersScreen() {
  return (
    <main className="min-h-screen-safe bg-background">
      <PartnersPage />
    </main>
  );
}