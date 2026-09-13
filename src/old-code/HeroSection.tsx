/** type: component — Landing hero with primary headline, subtitle, and CTA button. */
"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F0] to-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Your own branded creator app
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          A PWA with content, social links, partnerships, push notifications and payments — no app store required.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-2xl bg-[#5A6A4A] px-8 py-3 text-sm font-bold text-white hover:bg-[#4A5A3A]"
          >
            Get Started Free
          </Link>
          <Link
            href="/search"
            className="rounded-2xl border border-gray-200 px-8 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Discover Creators
          </Link>
        </div>
      </div>
    </section>
  );
}
