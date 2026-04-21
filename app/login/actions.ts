"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function buildRedirectUrl(
  path: string,
  values: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export async function login(formData: FormData) {
  const email = getTextValue(formData, "email");
  const password = getTextValue(formData, "password");
  const returnTo = getTextValue(formData, "returnTo") || "/dashboard";

  if (!email || !password) {
    redirect(
      buildRedirectUrl("/login", {
        error: "Please enter both your email and password.",
        returnTo,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      buildRedirectUrl("/login", {
        error: error.message,
        returnTo,
      }),
    );
  }

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function signup(formData: FormData) {
  const email = getTextValue(formData, "email");
  const password = getTextValue(formData, "password");
  const returnTo = getTextValue(formData, "returnTo") || "/dashboard";

  if (!email || !password) {
    redirect(
      buildRedirectUrl("/login", {
        error: "Please enter both your email and password.",
        returnTo,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(
      buildRedirectUrl("/login", {
        error: error.message,
        returnTo,
      }),
    );
  }

  redirect(
    buildRedirectUrl("/login", {
      message:
        "Account created. If email confirmation is enabled in Supabase, please confirm your email before logging in.",
      returnTo,
    }),
  );
}
