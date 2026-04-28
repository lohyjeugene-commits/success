import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
            TouchGrass
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 lg:hidden">
          <Link href="/groups" className="transition hover:text-slate-950">
            Groups
          </Link>
          <Link href="/find-match" className="transition hover:text-slate-950">
            Find Match
          </Link>
          <Link href="/create-group" className="transition hover:text-slate-950">
            Create
          </Link>
          {user && (
            <Link href="/my-groups" className="transition hover:text-slate-950">
              My Groups
            </Link>
          )}
          <Link href="/settings" className="transition hover:text-slate-950">
            Settings
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="transition hover:text-slate-950">
                Dashboard
              </Link>
              <Link href="/profile" className="transition hover:text-slate-950">
                Profile
              </Link>
            </>
          ) : (
            <Link href="/login" className="transition hover:text-slate-950">
              Log in
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-4 text-sm text-slate-600 lg:flex">
          <Link href="/groups" className="transition hover:text-slate-950">
            Groups
          </Link>
          <Link href="/find-match" className="transition hover:text-slate-950">
            Find Match
          </Link>
          <Link href="/create-group" className="transition hover:text-slate-950">
            Create
          </Link>
          {user && (
            <Link href="/my-groups" className="transition hover:text-slate-950">
              My Groups
            </Link>
          )}
          <Link href="/settings" className="transition hover:text-slate-950">
            Settings
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="transition hover:text-slate-950">
                Dashboard
              </Link>
              <Link href="/profile" className="transition hover:text-slate-950">
                Profile
              </Link>
            </>
          ) : null}

          {user ? (
            <>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {user.email ?? "Signed in"}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Log in
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 lg:hidden">
          {user ? (
            <>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {user.email ?? "Signed in"}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Log out
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
