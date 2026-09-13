/** Dashboard root — old URL; Overview now lives at /dashboard/overview. Keeps old links working. */
import { redirect } from "next/navigation";

export default function DashboardRootPage() {
  redirect("/dashboard/overview");
}