/** TODO: Add purpose docstring. */
import Link from "next/link";
import { Trees } from "lucide-react";
import type { Metadata } from "next";
import { LandingPWA } from "@/components/landing/LandingPWA";

export function generateMetadata(): Metadata {
  return {
    title: "BioTree Platform",
    description: "Premium PWA SaaS platform for creators",
    manifest: "/manifest.json",
    icons: {
      apple: "/icons/icon-192x192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "BioTree",
    },
    openGraph: {
      title: "BioTree",
      description: "Your fans deserve more than a Linktree",
    },
  };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#3D3A35] flex flex-col">
      <LandingPWA />
      {/* NAV */}
      <nav className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A6A4A] text-white shadow-sm">
            <Trees size={20} />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[#2D2A26]">BioTree</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-[#2D2A26] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1A1816] transition-colors shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-24 pb-16 text-center max-w-3xl mx-auto flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F0EDE4] px-4 py-1.5 text-xs font-bold text-[#5A6A4A] uppercase tracking-widest mb-6">
          <div className="w-2 h-2 rounded-full bg-[#5A6A4A] animate-pulse"></div>
          Mobile Installable
        </div>

        <h1 className="text-5xl sm:text-6xl font-serif font-bold text-[#2D2A26] leading-tight tracking-tight mb-6">
          Your fans deserve more <br/>
          <span className="text-[#A67C52] italic">than a Linktree</span>
        </h1>

        <p className="text-lg text-[#7A7468] max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          Give your TikTok and Instagram fans their own installable app. Sell content, send push notifications, and build a direct connection — no app store needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto rounded-xl bg-[#5A6A4A] px-8 py-4 text-base font-bold text-white hover:bg-[#47543a] transition-all shadow-md active:scale-95"
          >
            Get your app — starting free →
          </Link>
          <Link
            href={`/${process.env.NEXT_PUBLIC_DEMO_USERNAME ?? "rowin"}`}
            className="w-full sm:w-auto rounded-xl border border-[#E8E4DB] px-8 py-4 text-base font-bold text-[#3D3A35] hover:bg-white transition-all"
          >
            See a live demo
          </Link>
        </div>

        <p className="mt-6 text-sm text-[#9A9488]">
          No app store. No monthly fees to start. Set up in 2 minutes.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 bg-white border-t border-[#E8E4DB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-[#2D2A26] mb-12">
            How it works
          </h2>
          <p className="text-center text-[#7A7468] mb-12">From bio link to installable app in minutes.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#F0EDE4] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🔗</div>
              <h3 className="font-bold text-[#2D2A26] mb-2">Get your link</h3>
              <p className="text-sm text-[#7A7468]">You receive a unique link like BioTree.app/yourname to put in your TikTok or Instagram bio.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#F0EDE4] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">📲</div>
              <h3 className="font-bold text-[#2D2A26] mb-2">Fans install your app</h3>
              <p className="text-sm text-[#7A7468]">When fans click your link, they see your page and get prompted to add it to their home screen like a real app.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#F0EDE4] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">💰</div>
              <h3 className="font-bold text-[#2D2A26] mb-2">Sell and connect</h3>
              <p className="text-sm text-[#7A7468]">Upload content, set prices, send push notifications directly to every fan who installs your app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-center text-[#2D2A26] mb-4">
          Everything creators need
        </h2>
        <p className="text-center text-[#7A7468] mb-12">One tool that replaces five</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            icon="📱"
            title="Installable PWA"
            description="Fans add your app to their home screen. Opens instantly, works offline, feels native."
          />
          <FeatureCard
            icon="🔔"
            title="Push notifications"
            description="Send a message directly to every fan who installs your app. No algorithm, no feed — straight to their screen."
          />
          <FeatureCard
            icon="🎬"
            title="Sell any content"
            description="Audio, video, PDFs, courses, coaching sessions, physical products. All in one place."
          />
          <FeatureCard
            icon="💎"
            title="Free + paid content"
            description="Offer free content to build trust, lock premium content behind payment. Your choice per item."
          />
          <FeatureCard
            icon="🤝"
            title="Collaborations"
            description="Connect with other creators, share audiences, and earn commissions when you send them clients."
          />
          <FeatureCard
            icon="📊"
            title="Real analytics"
            description="See how many fans install your app, which links they click, and how much you earn."
          />
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-6 py-20 bg-white border-t border-[#E8E4DB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-[#2D2A26] mb-12">
            Why not just use Linktree?
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F5F0] border-b border-[#E8E4DB]">
                  <th className="text-left p-4 font-bold text-[#2D2A26]">Feature</th>
                  <th className="text-center p-4 font-bold text-[#5A6A4A]">BioTree</th>
                  <th className="text-center p-4 font-bold text-[#9A9488]">Linktree</th>
                </tr>
              </thead>
              <tbody>
                <TableRow feature="Lives on fans' home screen" bio="✅" linktree="❌" />
                <TableRow feature="Push notifications to fans" bio="✅" linktree="❌" />
                <TableRow feature="Sell content directly" bio="✅" linktree="❌" />
                <TableRow feature="Works offline" bio="✅" linktree="❌" />
                <TableRow feature="Create partnerships & referrals" bio="✅" linktree="❌" />
                <TableRow feature="Just a list of links" bio="❌" linktree="✅" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#9A9488] border-t border-[#E8E4DB] bg-white">
        Powered by BioTree
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E4DB] shadow-sm hover:shadow-md transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-[#2D2A26] mb-1">{title}</h3>
      <p className="text-sm text-[#7A7468]">{description}</p>
    </div>
  );
}

function TableRow({ feature, bio, linktree }: { feature: string; bio: string; linktree: string }) {
  const isBioGreen = bio === "✅";
  const isLinktreeGreen = linktree === "✅";
  return (
    <tr className="border-b border-[#E8E4DB] last:border-0">
      <td className="p-4 text-[#3D3A35]">{feature}</td>
      <td className={`p-4 text-center text-xl ${isBioGreen ? "text-green-600" : "text-red-400"}`}>{bio}</td>
      <td className={`p-4 text-center text-xl ${isLinktreeGreen ? "text-green-600" : "text-red-400"}`}>{linktree}</td>
    </tr>
  );
}
