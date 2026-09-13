/**
 * Admin screen at /admin — server component with metadata export.
 * Renders the AdminClient component which handles auth guard and tabbed layout.
 */
import type { Metadata } from "next";
import { AdminClient } from "@/components/admin/AdminClient";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminScreen() {
  return <AdminClient />;
}
