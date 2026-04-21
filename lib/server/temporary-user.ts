import { cookies } from "next/headers";

const temporaryUserIdCookieName = "touchgrass_temporary_user_id";

export async function getExistingTemporaryUserId() {
  const cookieStore = await cookies();

  return cookieStore.get(temporaryUserIdCookieName)?.value ?? null;
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
