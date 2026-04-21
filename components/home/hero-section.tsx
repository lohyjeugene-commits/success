import Link from "next/link";

const focusPoints = [
  "Create or join small groups",
  "Suggest meetup time slots",
  "Vote on what works",
];

export function HeroSection() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Singapore meetup MVP
          </span>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Create small activity groups, suggest meetup times, and vote on
              availability.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              TouchGrass helps people in Singapore host or join real-life groups
              for basketball, study sessions, gym, cycling, dance, and library
              meetups, then coordinate the best time to meet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/groups"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Groups
            </Link>
            <Link
              href="/create-group"
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Create Group
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-inner">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            What the MVP does
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
