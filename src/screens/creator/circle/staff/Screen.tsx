/** Staff screen at /dashboard/circle/staff — team invites, members, permissions (team.md). */
import type { Metadata } from "next";
import { StaffPage } from "@/components/circle/staff/StaffPage";

export const metadata: Metadata = {
  title: "Staff",
};

export default function StaffScreen() {
  return (
    <main className="min-h-screen-safe bg-background">
      <StaffPage />
    </main>
  );
}