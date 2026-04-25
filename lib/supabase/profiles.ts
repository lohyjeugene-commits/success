import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

export type UserProfileRow = {
  avatar_emoji: string | null;
  bio: string | null;
  created_at: string;
  favorite_activity: string | null;
  full_name: string | null;
  home_area: string | null;
  id: string;
  profile_picture_url: string | null;
  updated_at: string;
  username: string | null;
};

function buildDefaultUsername(user: User) {
  const rawValue =
    (typeof user.email === "string" ? user.email.split("@")[0] : "touchgrass-user") ||
    "touchgrass-user";

  return rawValue
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export async function ensureProfileForUser(user: User) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("profiles").upsert(
    [
      {
        id: user.id,
        username: buildDefaultUsername(user),
      },
    ],
    {
      ignoreDuplicates: true,
      onConflict: "id",
    },
  );
}

export async function getCurrentUserProfile(user: User) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, favorite_activity, home_area, avatar_emoji, profile_picture_url, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      errorMessage: `Could not load profile: ${error.message}`,
      profile: null,
    };
  }

  return {
    errorMessage: null,
    profile: (data ?? null) as UserProfileRow | null,
  };
}

export async function getPublicProfileById(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, favorite_activity, home_area, avatar_emoji, profile_picture_url, created_at, updated_at",
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    return {
      errorMessage: `Could not load profile: ${error.message}`,
      profile: null,
    };
  }

  return {
    errorMessage: null,
    profile: (data ?? null) as UserProfileRow | null,
  };
}
