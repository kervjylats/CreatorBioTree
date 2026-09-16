/**
 * Landing screen at / — the public homepage (landing.md).
 * Responsive: 1-col phone → 2/3-col tablet/desktop. Platform tokens, not creator branding.
 * Old-code pattern adapted: hero, how-it-works, features, comparison, footer.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Trees } from "lucide-react";

export const metadata: Metadata = {
  title: "CreatorBioTree — Your fans deserve more than a Linktree",
  description: "Give your TikTok and Instagram fans their own installable app. Sell content, send push notifications, and build a direct connection — no app store needed.",
  manifest: "/manifest.json",
  openGraph: {
    title: "CreatorBioTree",
    description: "Your fans deserve more than a Linktree",
  },
};

export default function LandingScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Trees size={20} />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground">BioTree</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-colors shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center max-w-3xl mx-auto flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest mb-6">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Mobile Installable
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight tracking-tight mb-6">
          Your fans deserve more <br />
          <span className="text-secondary italic">than a Linktree</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
          Give your TikTok and Instagram fans their own installable app. Sell content, send push notifications, and build a direct connection — no app store needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            Get your app — starting free →
          </Link>
          <Link
            href={`/${process.env.NEXT_PUBLIC_DEMO_USERNAME ?? "rowin"}`}
            className="w-full sm:w-auto rounded-xl border border-border px-8 py-4 text-base font-bold text-foreground hover:bg-card transition-all"
          >
            See a live demo
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          No app store. No monthly fees to start. Set up in 2 minutes.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 sm:py-20 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-foreground mb-4">
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-10 sm:mb-12">From bio link to installable app in minutes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-5 sm:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🔗</div>
              <h3 className="font-bold text-foreground mb-2">Get your link</h3>
              <p className="text-sm text-muted-foreground">You receive a unique link like BioTree.app/yourname to put in your TikTok or Instagram bio.</p>
            </div>

            <div className="text-center p-5 sm:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">📲</div>
              <h3 className="font-bold text-foreground mb-2">Fans install your app</h3>
              <p className="text-sm text-muted-foreground">When fans click your link, they see your page and get prompted to add it to their home screen like a real app.</p>
            </div>

            <div className="text-center p-5 sm:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">💰</div>
              <h3 className="font-bold text-foreground mb-2">Sell and connect</h3>
              <p className="text-sm text-muted-foreground">Upload content, set prices, send push notifications directly to every fan who installs your app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="px-6 py-16 sm:py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-foreground mb-4">
          Everything creators need
        </h2>
        <p className="text-center text-muted-foreground mb-10 sm:mb-12">One tool that replaces five</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <FeatureCard icon="📱" title="Installable PWA" description="Fans add your app to their home screen. Opens instantly, works offline, feels native." />
          <FeatureCard icon="🔔" title="Push notifications" description="Send a message directly to every fan who installs your app. No algorithm, no feed — straight to their screen." />
          <FeatureCard icon="🎬" title="Sell any content" description="Audio, video, PDFs, courses, coaching sessions, physical products. All in one place." />
          <FeatureCard icon="💎" title="Free + paid content" description="Offer free content to build trust, lock premium content behind payment. Your choice per item." />
          <FeatureCard icon="🤝" title="Collaborations" description="Connect with other creators, share audiences, and earn commissions when you send them clients." />
          <FeatureCard icon="📊" title="Real analytics" description="See how many fans install your app, which links they click, and how much you earn." />
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-6 py-16 sm:py-20 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-foreground mb-10 sm:mb-12">
            Why not just use Linktree?
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="text-left p-3 sm:p-4 font-bold text-foreground">Feature</th>
                  <th className="text-center p-3 sm:p-4 font-bold text-primary">BioTree</th>
                  <th className="text-center p-3 sm:p-4 font-bold text-muted-foreground">Linktree</th>
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
      <footer className="py-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground border-t border-border bg-card">
        Powered by BioTree
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TableRow({ feature, bio, linktree }: { feature: string; bio: string; linktree: string }) {
  const isBioGreen = bio === "✅";
  const isLinktreeGreen = linktree === "✅";
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3 sm:p-4 text-foreground text-sm sm:text-base">{feature}</td>
      <td className={`p-3 sm:p-4 text-center text-lg sm:text-xl ${isBioGreen ? "text-green-600" : "text-red-400"}`}>{bio}</td>
      <td className={`p-3 sm:p-4 text-center text-lg sm:text-xl ${isLinktreeGreen ? "text-green-600" : "text-red-400"}`}>{linktree}</td>
    </tr>
  );
}
