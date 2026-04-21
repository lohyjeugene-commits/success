import type { LaunchStep } from "@/types/home";

type StepCardProps = {
  number: number;
  step: LaunchStep;
};

export function StepCard({ number, step }: StepCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/70 bg-white/75 p-6 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.22)] backdrop-blur">
      <div className="space-y-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
          {number}
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            {step.title}
          </h3>
          <p className="text-sm leading-6 text-slate-600">{step.description}</p>
        </div>
      </div>
    </article>
  );
}
