/** Fans screen at /dashboard/network/fans — fan list, filters, profile drawer (relationships.md). */
import type { Metadata } from "next";
import { FansPage } from "@/components/network/FansPage";

export const metadata: Metadata = {
  title: "Fans",
};

export default function FansScreen() {
  return (
    <main className="min-h-screen bg-background">
      <FansPage />
    </main>
  );
}