/** type: component — Feature comparison grid showing the platform's main capabilities. */
"use client";

const FEATURES = [
  { icon: "📱", title: "Branded PWA", desc: "Installable phone app per creator, no app store." },
  { icon: "🔗", title: "Smart Links", desc: "Link-in-bio with social, store, content, and more." },
  { icon: "💬", title: "Push Notifications", desc: "Notify fans directly — no algorithm, no spam." },
  { icon: "🤝", title: "Partnerships", desc: "Cross-promote with other creators. Track referrals." },
  { icon: "💰", title: "Monetization", desc: "Sell content, memberships, digital products." },
  { icon: "📊", title: "Analytics", desc: "See who follows, what performs, what converts." },
];

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold text-gray-900">Everything you need to grow</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-gray-500">
          One platform to create, publish, and monetise your brand.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-[#E8E4DB] bg-white p-6 shadow-sm">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
