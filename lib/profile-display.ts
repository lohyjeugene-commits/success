type ProfileIdentity = {
  avatar_emoji?: string | null;
  full_name?: string | null;
  username?: string | null;
};

function getInitialsFromWords(words: string[]) {
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return null;
}

export function getProfileTitle(profile: Pick<ProfileIdentity, "full_name" | "username">) {
  return profile.full_name || profile.username || "TouchGrass member";
}

export function getProfileInitials(
  profile: Pick<ProfileIdentity, "full_name" | "username">,
) {
  const trimmedFullName = profile.full_name?.trim() ?? "";

  if (trimmedFullName) {
    const fullNameWords = trimmedFullName.split(/\s+/).filter(Boolean);
    const fullNameInitials = getInitialsFromWords(fullNameWords);

    if (fullNameInitials) {
      return fullNameInitials;
    }
  }

  const trimmedUsername = profile.username?.trim().replace(/^@/, "") ?? "";

  if (trimmedUsername) {
    const usernameWords = trimmedUsername.split(/[\s._-]+/).filter(Boolean);
    const usernameInitials = getInitialsFromWords(usernameWords);

    if (usernameInitials) {
      return usernameInitials;
    }
  }

  return null;
}

export function getProfileAvatarFallback(profile: ProfileIdentity) {
  return getProfileInitials(profile) || profile.avatar_emoji?.trim() || "TG";
}
