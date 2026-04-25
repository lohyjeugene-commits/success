"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { isMissingColumnError, isPermissionDeniedError } from "@/lib/supabase/errors";
import { getMembershipsForUser } from "@/lib/supabase/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseActionError = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function buildRedirectUrl(redirectTo: string, key: string, value: string) {
  const searchParams = new URLSearchParams({
    [key]: value,
  });

  return `${redirectTo}?${searchParams.toString()}`;
}

function getAuthMigrationHintMessage() {
  return "Run the SQL in supabase/migrations/20260422_add_auth_profiles_permissions_and_dashboard.sql and supabase/migrations/20260425_add_group_delete_policy.sql.";
}

function getSupabaseErrorMessage(
  error: SupabaseActionError,
  fallbackMessage: string,
) {
  const messageParts = [
    error.message?.trim(),
    error.details?.trim(),
    error.hint?.trim(),
  ].filter(Boolean);

  if (messageParts.length > 0) {
    return messageParts.join(" ");
  }

  if (error.code) {
    return `${fallbackMessage} (code: ${error.code})`;
  }

  return fallbackMessage;
}

async function getManagedGroupIds(userId: string) {
  const supabase = await createSupabaseServerClient();
  const membershipsResult = await getMembershipsForUser(supabase, userId);

  if (membershipsResult.errorMessage) {
    return {
      errorMessage: membershipsResult.errorMessage,
      groupIds: [] as string[],
      supabase,
    };
  }

  const groupIds = new Set(
    membershipsResult.memberships
      .filter(
        (membership) =>
          membership.role === "admin" || membership.role === "creator",
      )
      .map((membership) => membership.group_id),
  );

  const creatorGroupsResult = await supabase
    .from("activity_groups")
    .select("id")
    .eq("creator_user_id", userId);

  if (
    creatorGroupsResult.error &&
    !isMissingColumnError(creatorGroupsResult.error, "creator_user_id")
  ) {
    return {
      errorMessage: `Could not load managed groups: ${getSupabaseErrorMessage(
        creatorGroupsResult.error,
        "Supabase returned an unknown error while loading groups you manage.",
      )}`,
      groupIds: [] as string[],
      supabase,
    };
  }

  for (const group of (creatorGroupsResult.data ?? []) as { id: string }[]) {
    groupIds.add(group.id);
  }

  return {
    errorMessage: null,
    groupIds: [...groupIds],
    supabase,
  };
}

export async function deleteManagedGroups(formData: FormData) {
  const redirectTo = getTextValue(formData, "redirect_to") || "/dashboard";
  const user = await requireAuthenticatedUser({
    message: "Please log in to manage and delete groups.",
    returnTo: redirectTo,
  });
  const managedGroupsState = await getManagedGroupIds(user.id);

  if (managedGroupsState.errorMessage) {
    redirect(
      buildRedirectUrl(redirectTo, "error", managedGroupsState.errorMessage),
    );
  }

  if (managedGroupsState.groupIds.length === 0) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "You do not have any groups you can delete as an admin.",
      ),
    );
  }

  const deleteResult = await managedGroupsState.supabase
    .from("activity_groups")
    .delete()
    .in("id", managedGroupsState.groupIds)
    .select("id");

  if (deleteResult.error) {
    const errorMessage = isPermissionDeniedError(deleteResult.error)
      ? `Could not delete groups because your account does not yet have delete permission. ${getAuthMigrationHintMessage()}`
      : `Could not delete groups: ${getSupabaseErrorMessage(
          deleteResult.error,
          "Supabase returned an unknown error while deleting groups.",
        )}`;

    redirect(buildRedirectUrl(redirectTo, "error", errorMessage));
  }

  const deletedGroupIds = ((deleteResult.data ?? []) as { id: string }[]).map(
    (group) => group.id,
  );
  const deletedCount = deletedGroupIds.length;

  if (deletedCount === 0) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "No groups were deleted. Check that the delete policy migration has been applied.",
      ),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/supabase-test");
  revalidatePath("/create-group");

  for (const groupId of deletedGroupIds) {
    revalidatePath(`/groups/${groupId}`);
  }

  redirect(
    buildRedirectUrl(
      redirectTo,
      "message",
      `Deleted ${deletedCount} managed group${deletedCount === 1 ? "" : "s"}.`,
    ),
  );
}
