import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
        >
          Back to home
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Settings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Appearance
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Choose the theme that feels best on this device. Dark mode stays as
            the default, and your selection is saved locally after refresh.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Theme
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Light or dark
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              The theme switch is stored in `localStorage`, so it stays on this
              browser even after you close and reopen the app.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-950">
                  Select your theme
                </p>
                <p className="text-sm text-slate-600">
                  Dark is the default, but you can switch to light any time.
                </p>
              </div>

              <ThemeToggle size="md" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
