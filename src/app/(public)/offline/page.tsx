/** Offline fallback — /offline. */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline",
};

export { default } from "@/screens/public/offline";