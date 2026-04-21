import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

type RequireUserOptions = {
  message?: string;
  returnTo?: string;
};

function buildLoginRedirectUrl(returnTo: string | undefined, message: string) {
  const searchParams = new URLSearchParams({
    message,
  });

  if (returnTo) {
    searchParams.set("returnTo", returnTo);
  }

  return `/login?${searchParams.toString()}`;
}

export function getDisplayNameForUser(user: Pick<User, "email" | "user_metadata">) {
  const fullName = user.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return "TouchGrass member";
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuthenticatedUser(options?: RequireUserOptions) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(
      buildLoginRedirectUrl(
        options?.returnTo,
        options?.message ?? "Please log in to continue.",
      ),
    );
  }

  return user;
}
