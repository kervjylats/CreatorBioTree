/** Landing screen at / — the public homepage (and creator page fallback). Wire from src/wiredLater/screens/public/landing.md in Phase F. */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CreatorBioTree",
};

export default function LandingScreen() {
  return <main className="min-h-screen bg-background" />;
}