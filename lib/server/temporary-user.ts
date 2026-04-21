import { cookies } from "next/headers";

const temporaryUserIdCookieName = "touchgrass_temporary_user_id";
const temporaryDisplayNameCookieName = "touchgrass_display_name";

function normalizeDisplayName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 30);
}

export async function getExistingTemporaryUserId() {
  const cookieStore = await cookies();

  return cookieStore.get(temporaryUserIdCookieName)?.value ?? null;
}

export async function getExistingTemporaryDisplayName() {
  const cookieStore = await cookies();

  return cookieStore.get(temporaryDisplayNameCookieName)?.value ?? null;
}

export async function getOrCreateTemporaryUserId() {
  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(temporaryUserIdCookieName)?.value;

  if (existingUserId) {
    return existingUserId;
  }

  const newUserId = crypto.randomUUID();

  cookieStore.set(temporaryUserIdCookieName, newUserId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return newUserId;
}

export async function getOrCreateTemporaryIdentity(providedDisplayName?: string) {
  const cookieStore = await cookies();
  const temporaryUserId = await getOrCreateTemporaryUserId();
  const existingDisplayName =
    cookieStore.get(temporaryDisplayNameCookieName)?.value ?? null;

  if (existingDisplayName) {
    return {
      displayName: existingDisplayName,
      missingDisplayName: false,
      temporaryUserId,
    };
  }

  const normalizedDisplayName = normalizeDisplayName(providedDisplayName ?? "");

  if (!normalizedDisplayName) {
    return {
      displayName: null,
      missingDisplayName: true,
      temporaryUserId,
    };
  }

  cookieStore.set(temporaryDisplayNameCookieName, normalizedDisplayName, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return {
    displayName: normalizedDisplayName,
    missingDisplayName: false,
    temporaryUserId,
  };
}

export function formatTemporaryUserLabel(
  rawUserId: string | null | undefined,
  displayName?: string | null,
) {
  const normalizedDisplayName = normalizeDisplayName(displayName ?? "");

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const trimmedUserId = rawUserId?.trim() ?? "";

  if (!trimmedUserId) {
    return "User unknown";
  }

  return `User ${trimmedUserId.slice(-4)}`;
}
