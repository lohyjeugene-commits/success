import { HeroSection } from "@/components/home/hero-section";
import { StepCard } from "@/components/home/step-card";
import { launchSteps } from "@/lib/home-content";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <HeroSection />

        <section id="how-it-works" className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              A simple flow for getting people offline.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The current MVP is focused on three things only: forming a small
              group, proposing a few meetup times, and helping people vote on
              the best option.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {launchSteps.map((step, index) => (
              <StepCard key={step.title} number={index + 1} step={step} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
