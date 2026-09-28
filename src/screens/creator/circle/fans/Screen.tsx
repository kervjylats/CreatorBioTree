/** Fans screen at /dashboard/circle/fans — fan list, filters, profile drawer (relationships.md). */
import type { Metadata } from "next";
import { FansPage } from "@/components/circle/fans/FansPage";

export const metadata: Metadata = {
  title: "Fans",
};

export default function FansScreen() {
  return (
    <main className="min-h-screen-safe bg-background">
      <FansPage />
    </main>
  );
}