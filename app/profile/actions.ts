"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export async function updateProfile(formData: FormData) {
  const user = await requireAuthenticatedUser({
    message: "Please log in to edit your profile.",
    returnTo: "/profile",
  });
  const supabase = await createSupabaseServerClient();
  const username = normalizeUsername(getTextValue(formData, "username"));
  const fullName = getTextValue(formData, "full_name");
  const bio = getTextValue(formData, "bio");
  const favoriteActivity = getTextValue(formData, "favorite_activity");
  const homeArea = getTextValue(formData, "home_area");
  const avatarEmoji = getTextValue(formData, "avatar_emoji");

  const { error } = await supabase.from("profiles").upsert(
    [
      {
        avatar_emoji: avatarEmoji || null,
        bio: bio || null,
        favorite_activity: favoriteActivity || null,
        full_name: fullName || null,
        home_area: homeArea || null,
        id: user.id,
        username: username || null,
      },
    ],
    {
      onConflict: "id",
    },
  );

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath("/", "layout");
  redirect("/profile?message=Profile+saved.");
}
