/** type: component — Global site footer with navigation links, social, and copyright. */
"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5A6A4A] text-sm text-white font-bold">
                ⚡
              </div>
              <span className="font-bold text-gray-900">BioTree</span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Creator-branded PWA platform.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Product</p>
            <div className="mt-3 space-y-2">
              <Link href="/search" className="block text-sm text-gray-600 hover:text-gray-900">Discover</Link>
              <Link href="/pricing" className="block text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Account</p>
            <div className="mt-3 space-y-2">
              <Link href="/login" className="block text-sm text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/onboarding" className="block text-sm text-gray-600 hover:text-gray-900">Sign up</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Legal</p>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-400">Terms & Privacy</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} CreatorBioTree
        </div>
      </div>
    </footer>
  );
}
