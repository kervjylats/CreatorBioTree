/** Partners screen at /dashboard/network/partners — requests, active collabs, invite card (network.md). */
import type { Metadata } from "next";
import { PartnersPage } from "@/components/network/PartnersPage";

export const metadata: Metadata = {
  title: "Partners",
};

export default function PartnersScreen() {
  return (
    <main className="min-h-screen bg-background">
      <PartnersPage />
    </main>
  );
}