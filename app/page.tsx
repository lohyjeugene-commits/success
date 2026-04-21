import { ActivityCard } from "@/components/home/activity-card";
import { HeroSection } from "@/components/home/hero-section";
import { StepCard } from "@/components/home/step-card";
import { activityGroups, launchSteps } from "@/lib/home-content";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <HeroSection />

        <section id="how-it-works" className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              MVP flow
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Keep the first version simple and offline-first.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The earliest TouchGrass experience can focus on a clear loop:
              someone hosts a small activity, a few people join, and the group
              chats before meeting up in real life.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {launchSteps.map((step, index) => (
              <StepCard key={step.title} number={index + 1} step={step} />
            ))}
          </div>
        </section>

        <section id="activities" className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
              Starter categories
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Real-life meetups people instantly understand.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The homepage is seeded with the six activity types you mentioned,
              giving the project a clear product direction without building the
              full feature set yet.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activityGroups.map((activity) => (
              <ActivityCard key={activity.title} activity={activity} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
