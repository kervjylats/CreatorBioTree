/** Staff screen at /dashboard/network/staff — team invites, members, permissions (team.md). */
import type { Metadata } from "next";
import { StaffPage } from "@/components/network/StaffPage";

export const metadata: Metadata = {
  title: "Staff",
};

export default function StaffScreen() {
  return (
    <main className="min-h-screen bg-background">
      <StaffPage />
    </main>
  );
}