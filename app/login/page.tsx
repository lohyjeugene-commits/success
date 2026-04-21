import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
    returnTo?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);
  const returnTo = getSearchParamValue(resolvedSearchParams.returnTo) || "/dashboard";
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(returnTo);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            TouchGrass access
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Log in to manage your meetups.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Sign in to create groups, join as a real member, update your public
            profile, and manage meetup invites from one dashboard.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              "Join groups with your real account",
              "Create a public profile others can read",
              "Track meetup slots and accept invites",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
              >
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/groups"
            className="mt-8 inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
          >
            Browse groups first
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:w-[420px]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Email login
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Use the same form for sign in or sign up. New accounts will be
              created in Supabase Auth.
            </p>
          </div>

          <form className="mt-6 space-y-5">
            <input type="hidden" name="returnTo" value={returnTo} />

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                formAction={login}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Log in
              </button>
              <button
                formAction={signup}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create account
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
