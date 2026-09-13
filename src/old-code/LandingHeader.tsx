/** type: component — Landing page navigation bar with logo, links, and login/signup CTA buttons. */
"use client";

import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5A6A4A] text-sm text-white font-bold">
            ⚡
          </div>
          <span className="text-lg font-bold text-gray-900">BioTree</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex">
          <Link href="/features" className="hover:text-gray-900">Features</Link>
          <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
          <Link href="/search" className="hover:text-gray-900">Discover</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-2xl bg-[#5A6A4A] px-5 py-2 text-sm font-bold text-white hover:bg-[#4A5A3A]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
