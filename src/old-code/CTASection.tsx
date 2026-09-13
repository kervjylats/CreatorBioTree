/** type: component — Final call-to-action section prompting signup. */
"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-[#F7F5F0] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Ready to build your creator app?</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-500">
          Free to start. No app store. No coding. No limits.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-block rounded-2xl bg-[#5A6A4A] px-10 py-4 text-sm font-bold text-white hover:bg-[#4A5A3A]"
        >
          Get Started Free
        </Link>
        <p className="mt-3 text-xs text-gray-400">No credit card required</p>
      </div>
    </section>
  );
}
