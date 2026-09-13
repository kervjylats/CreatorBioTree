/** type: component — Social proof section with creator testimonials and stats. */
"use client";

const TESTIMONIALS = [
  { name: "Priya S.", role: "Fitness Creator", text: "My fans love the app. It feels like a real brand now." },
  { name: "Marcus T.", role: "Musician", text: "Push notifications alone doubled my engagement." },
  { name: "Aiko M.", role: "Artist", text: "I finally have my own space — no algorithm, no noise." },
];

export function TestimonialsSection() {
  return (
    <section className="bg-[#F7F5F0] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold text-gray-900">Creators love BioTree</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600 leading-relaxed">{t.text}</p>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
