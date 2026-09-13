/** type: component — Demo/video section showing product walkthroughs (content placeholder for later). */
"use client";

export function DemoSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">See it in action</h2>
        <p className="mx-auto mt-2 max-w-xl text-gray-500">
          Watch how creators build and publish their apps in minutes.
        </p>

        <div className="mt-10 mx-auto max-w-3xl rounded-3xl bg-gray-100 p-4 shadow-inner">
          <div className="aspect-video flex items-center justify-center rounded-2xl bg-gray-200 text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">▶</div>
              <p className="text-sm">Demo video placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
