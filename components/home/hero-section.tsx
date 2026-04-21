import Link from "next/link";

const focusPoints = [
  "Small groups only",
  "Host or join in minutes",
  "Built for Singapore meetups",
];

export function HeroSection() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            TouchGrass MVP starter
          </span>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Meet people offline in groups of four to six.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              TouchGrass is a lightweight Singapore-based concept for hosting or
              joining real-life activity groups around basketball, studying,
              gym, cycling, dance, and library sessions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/groups"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse Groups
            </Link>
            <Link
              href="/create-group"
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Create a Group
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              See the MVP structure
            </a>
            <Link
              href="/supabase-test"
              className="rounded-full border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Supabase Test
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-inner">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Launch focus
          </p>

          <div className="mt-5 space-y-4">
            {focusPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="text-base font-medium text-slate-100">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
