import type { ActivityGroup } from "@/types/home";

type ActivityCardProps = {
  activity: ActivityGroup;
};

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            {activity.title}
          </h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {activity.groupSize}
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {activity.description}
        </p>

        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-100">
          Best for: {activity.locationHint}
        </div>
      </div>
    </article>
  );
}
