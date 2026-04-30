"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isActivityCategory,
  isActivityInCategory,
  resolveActivityCategory,
  type ActivityCategory,
} from "@/lib/constants/activity-categories";
import {
  getAuthenticatedUser,
  getDisplayNameForUser,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";
import {
  isMissingColumnError,
  isMissingMaxMembersError,
  isPermissionDeniedError,
  isUniqueViolationError,
} from "@/lib/supabase/errors";
import { getOrCreateTemporaryIdentity } from "@/lib/server/temporary-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidSingaporeArea } from "@/lib/constants/singapore-areas";

const allowedMaxMembers = new Set(["2", "3", "4", "5", "6", "8", "10"]);

type MemberIdentity = {
  authUserId: string | null;
  displayName: string;
  userId: string;
};

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

function getMaxMembersValue(formData: FormData) {
  const rawValue = getTextValue(formData, "max_members");

  if (!rawValue || !allowedMaxMembers.has(rawValue)) {
    return 6;
  }

  return Number(rawValue);
}

function getSubmittedActivitySelection(formData: FormData) {
  const submittedActivityCategory = getTextValue(formData, "activity_category");
  const activityType = getTextValue(formData, "activity_type");

  if (!activityType) {
    return {
      activityCategory: null,
      activityType,
      isValid: false,
    };
  }

  if (!submittedActivityCategory) {
    return {
      activityCategory: resolveActivityCategory(null, activityType),
      activityType,
      isValid: true,
    };
  }

  if (!isActivityCategory(submittedActivityCategory)) {
    return {
      activityCategory: null,
      activityType,
      isValid: false,
    };
  }

  return {
    activityCategory: submittedActivityCategory,
    activityType,
    isValid: isActivityInCategory(submittedActivityCategory, activityType),
  };
}

function buildRedirectUrl(redirectTo: string, key: string, value: string) {
  const searchParams = new URLSearchParams({
    [key]: value,
  });

  return `${redirectTo}?${searchParams.toString()}`;
}

function getRedirectConfig(
  formData: FormData,
  defaults: {
    errorKey: string;
    redirectTo: string;
    successKey: string;
  },
) {
  return {
    errorKey: getTextValue(formData, "error_key") || defaults.errorKey,
    redirectTo: getTextValue(formData, "redirect_to") || defaults.redirectTo,
    successKey: getTextValue(formData, "success_key") || defaults.successKey,
  };
}

function getAuthMigrationHintMessage() {
  return "Run the SQL in supabase/migrations/20260422_add_auth_profiles_permissions_and_dashboard.sql.";
}

function getActivityCategoryMigrationHintMessage() {
  return "Run the SQL in supabase/migrations/20260430_add_activity_category_to_activity_groups.sql.";
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

async function getExistingMembershipState(
  supabase: SupabaseClient,
  groupId: string,
  identity: Pick<MemberIdentity, "authUserId" | "userId">,
) {
  let authUserIdError: SupabaseActionError | null = null;

  if (identity.authUserId) {
    const withAuthUserIdResult = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("auth_user_id", identity.authUserId)
      .limit(1);

    if (!withAuthUserIdResult.error) {
      return {
        alreadyJoined: (withAuthUserIdResult.data ?? []).length > 0,
        errorMessage: null,
      };
    }

    if (!isMissingColumnError(withAuthUserIdResult.error, "auth_user_id")) {
      authUserIdError = withAuthUserIdResult.error;
    }
  }

  const withUserIdResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", identity.userId)
    .limit(1);

  if (
    withUserIdResult.error &&
    !isMissingColumnError(withUserIdResult.error, "user_id")
  ) {
    if (
      isPermissionDeniedError(withUserIdResult.error) ||
      (authUserIdError && isPermissionDeniedError(authUserIdError))
    ) {
      return {
        alreadyJoined: false,
        errorMessage: null,
      };
    }

    return {
      alreadyJoined: false,
      errorMessage: `Could not check existing membership: ${getSupabaseErrorMessage(
        withUserIdResult.error,
        "Supabase returned an unknown error while checking membership.",
      )}`,
    };
  }

  if (withUserIdResult.error && authUserIdError) {
    if (isPermissionDeniedError(authUserIdError)) {
      return {
        alreadyJoined: false,
        errorMessage: null,
      };
    }

    return {
      alreadyJoined: false,
      errorMessage: `Could not check existing membership: ${getSupabaseErrorMessage(
        authUserIdError,
        "Supabase returned an unknown error while checking membership.",
      )}`,
    };
  }

  return {
    alreadyJoined: (withUserIdResult.data ?? []).length > 0,
    errorMessage: null,
  };
}

async function getGroupCapacityState(
  groupId: string,
  identity: Pick<MemberIdentity, "authUserId" | "userId">,
) {
  const supabase = await createSupabaseServerClient();
  let maxMembers: number | null = null;

  let groupResult = await supabase
    .from("activity_groups")
    .select("id, max_members")
    .eq("id", groupId)
    .maybeSingle();

  if (groupResult.error && isMissingMaxMembersError(groupResult.error)) {
    groupResult = await supabase
      .from("activity_groups")
      .select("id")
      .eq("id", groupId)
      .maybeSingle();
  }

  if (groupResult.error) {
    return {
      errorMessage: `Could not check group capacity: ${getSupabaseErrorMessage(
        groupResult.error,
        "Supabase returned an unknown error while checking group capacity.",
      )}`,
      maxMembers,
      memberCount: 0,
      supabase,
    };
  }

  if (!groupResult.data) {
    return {
      errorMessage: "Could not join group: group not found.",
      maxMembers,
      memberCount: 0,
      supabase,
    };
  }

  if ("max_members" in groupResult.data) {
    maxMembers = groupResult.data.max_members ?? null;
  }

  const memberCountResult = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (memberCountResult.error) {
    return {
      alreadyJoined: false,
      errorMessage: `Could not check current members: ${getSupabaseErrorMessage(
        memberCountResult.error,
        "Supabase returned an unknown error while checking the current member count.",
      )}`,
      maxMembers,
      memberCount: 0,
      supabase,
    };
  }

  const membershipState = await getExistingMembershipState(
    supabase,
    groupId,
    identity,
  );

  if (membershipState.errorMessage) {
    return {
      alreadyJoined: false,
      errorMessage: membershipState.errorMessage,
      maxMembers,
      memberCount: memberCountResult.count ?? 0,
      supabase,
    };
  }

  return {
    alreadyJoined: membershipState.alreadyJoined,
    errorMessage: null,
    maxMembers,
    memberCount: memberCountResult.count ?? 0,
    supabase,
  };
}

async function insertGroupMember(
  supabase: SupabaseClient,
  groupId: string,
  identity: MemberIdentity,
  role: "creator" | "member",
) {
  const insertPayload: {
    auth_user_id?: string;
    display_name?: string;
    group_id: string;
    name?: string;
    role?: string;
    user_id?: string;
  } = {
    display_name: identity.displayName || "Anonymous",
    group_id: groupId,
    name: identity.displayName,
    role,
    user_id: identity.userId,
  };

  if (identity.authUserId) {
    insertPayload.auth_user_id = identity.authUserId;
  }

  let missingAuthUserId = false;
  let missingRole = false;

  while (true) {
    const insertResult = await supabase.from("group_members").insert([
      insertPayload,
    ]);

    if (!insertResult.error) {
      return {
        error: null,
        missingAuthUserId,
        missingRole,
      };
    }

    if (isMissingColumnError(insertResult.error, "auth_user_id")) {
      delete insertPayload.auth_user_id;
      missingAuthUserId = true;
      continue;
    }

    if (isMissingColumnError(insertResult.error, "role")) {
      delete insertPayload.role;
      missingRole = true;
      continue;
    }

    if (isMissingColumnError(insertResult.error, "name")) {
      delete insertPayload.name;
      continue;
    }

    if (isMissingColumnError(insertResult.error, "display_name")) {
      delete insertPayload.display_name;
      continue;
    }

    if (isMissingColumnError(insertResult.error, "user_id")) {
      delete insertPayload.user_id;
      continue;
    }

    return {
      error: insertResult.error,
      missingAuthUserId,
      missingRole,
    };
  }
}

async function insertActivityGroup(
  supabase: SupabaseClient,
  {
    activityCategory,
    activityType,
    area,
    maxMembers,
    title,
    userId,
  }: {
    activityCategory: ActivityCategory;
    activityType: string;
    area: string;
    maxMembers: number;
    title: string;
    userId: string;
  },
) {
  const insertPayload: {
    activity_category?: ActivityCategory;
    activity_type: string;
    area: string;
    creator_user_id?: string;
    max_members?: number;
    title: string;
  } = {
    activity_category: activityCategory,
    activity_type: activityType,
    area,
    creator_user_id: userId,
    max_members: maxMembers,
    title,
  };

  let missingActivityCategory = false;
  let missingCreatorUserId = false;
  let missingMaxMembers = false;

  while (true) {
    const insertResult = await supabase
      .from("activity_groups")
      .insert([insertPayload])
      .select("id")
      .single();

    if (!insertResult.error) {
      return {
        error: null,
        groupId: insertResult.data.id,
        missingActivityCategory,
        missingCreatorUserId,
        missingMaxMembers,
      };
    }

    if (isMissingColumnError(insertResult.error, "activity_category")) {
      delete insertPayload.activity_category;
      missingActivityCategory = true;
      continue;
    }

    if (isMissingColumnError(insertResult.error, "creator_user_id")) {
      delete insertPayload.creator_user_id;
      missingCreatorUserId = true;
      continue;
    }

    if (isMissingMaxMembersError(insertResult.error)) {
      delete insertPayload.max_members;
      missingMaxMembers = true;
      continue;
    }

    return {
      error: insertResult.error,
      groupId: null,
      missingActivityCategory,
      missingCreatorUserId,
      missingMaxMembers,
    };
  }
}

export async function createGroup(formData: FormData) {
  const title = getTextValue(formData, "title");
  const activitySelection = getSubmittedActivitySelection(formData);
  const area = getTextValue(formData, "area");
  const maxMembers = getMaxMembersValue(formData);
  const { errorKey, redirectTo, successKey } = getRedirectConfig(formData, {
    errorKey: "createError",
    redirectTo: "/supabase-test",
    successKey: "createMessage",
  });

  if (!title || !activitySelection.activityType || !area) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "Please fill in all fields."));
  }

  if (!activitySelection.isValid || !activitySelection.activityCategory) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        "Please choose a valid activity category and specific activity.",
      ),
    );
  }

  if (!isValidSingaporeArea(area)) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        "Please select a valid area from the dropdown.",
      ),
    );
  }

  const user = await requireAuthenticatedUser({
    message: "Please log in to create a group.",
    returnTo: redirectTo,
  });
  const supabase = await createSupabaseServerClient();
  const groupInsertResult = await insertActivityGroup(supabase, {
    activityCategory: activitySelection.activityCategory,
    activityType: activitySelection.activityType,
    area,
    maxMembers,
    title,
    userId: user.id,
  });

  if (groupInsertResult.error || !groupInsertResult.groupId) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        `Could not create group: ${getSupabaseErrorMessage(
          groupInsertResult.error ?? {},
          "Supabase returned an unknown error while creating the group.",
        )}`,
      ),
    );
  }

  const membershipInsertResult = await insertGroupMember(
    supabase,
    groupInsertResult.groupId,
    {
      authUserId: user.id,
      displayName: getDisplayNameForUser(user),
      userId: user.id,
    },
    "creator",
  );

  if (
    membershipInsertResult.error &&
    !isUniqueViolationError(membershipInsertResult.error)
  ) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        `Group created, but creator membership could not be saved: ${getSupabaseErrorMessage(
          membershipInsertResult.error,
          "Supabase returned an unknown error while saving the creator membership.",
        )}`,
      ),
    );
  }

  const warnings: string[] = [];
  const needsActivityCategoryMigrationHint =
    groupInsertResult.missingActivityCategory;
  const needsAuthMigrationHint =
    groupInsertResult.missingCreatorUserId ||
    membershipInsertResult.missingAuthUserId ||
    membershipInsertResult.missingRole;

  if (groupInsertResult.missingActivityCategory) {
    warnings.push(
      "activity category was not saved because activity_category is missing.",
    );
  }

  if (groupInsertResult.missingMaxMembers) {
    warnings.push("max_members was not saved because the column is missing.");
  }

  if (groupInsertResult.missingCreatorUserId) {
    warnings.push(
      "creator ownership was not saved because creator_user_id is missing.",
    );
  }

  if (membershipInsertResult.missingAuthUserId) {
    warnings.push(
      "authenticated member tracking was not saved because auth_user_id is missing.",
    );
  }

  if (membershipInsertResult.missingRole) {
    warnings.push("group member role columns are missing.");
  }

  const migrationHints = [
    ...(needsActivityCategoryMigrationHint
      ? [getActivityCategoryMigrationHintMessage()]
      : []),
    ...(needsAuthMigrationHint ? [getAuthMigrationHintMessage()] : []),
  ];

  const successMessage =
    warnings.length > 0
      ? `Group created with fallback mode: ${warnings.join(" ")}${
          migrationHints.length > 0 ? ` ${migrationHints.join(" ")}` : ""
        }`
      : "Group created successfully.";

  revalidatePath("/supabase-test");
  revalidatePath("/groups");
  revalidatePath("/create-group");
  revalidatePath("/dashboard");
  redirect(buildRedirectUrl(redirectTo, successKey, successMessage));
}

export async function joinGroup(formData: FormData) {
  const groupId = getTextValue(formData, "group_id");
  const providedDisplayName = getTextValue(formData, "display_name");
  const { errorKey, redirectTo, successKey } = getRedirectConfig(formData, {
    errorKey: "joinError",
    redirectTo: "/supabase-test",
    successKey: "joinMessage",
  });

  if (!groupId) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "Missing group id."));
  }

  const authenticatedUser = await getAuthenticatedUser();
  let identity: MemberIdentity;

  if (authenticatedUser) {
    identity = {
      authUserId: authenticatedUser.id,
      displayName: getDisplayNameForUser(authenticatedUser),
      userId: authenticatedUser.id,
    };
  } else {
    const temporaryIdentity = await getOrCreateTemporaryIdentity(providedDisplayName);

    if (temporaryIdentity.missingDisplayName || !temporaryIdentity.displayName) {
      redirect(
        buildRedirectUrl(
          redirectTo,
          errorKey,
          "Please choose a display name before joining a group.",
        ),
      );
    }

    identity = {
      authUserId: null,
      displayName: temporaryIdentity.displayName,
      userId: temporaryIdentity.temporaryUserId,
    };
  }

  const capacityState = await getGroupCapacityState(groupId, identity);

  if (capacityState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, errorKey, capacityState.errorMessage));
  }

  if (capacityState.alreadyJoined) {
    redirect(
      buildRedirectUrl(redirectTo, successKey, "You already joined this group."),
    );
  }

  if (
    capacityState.maxMembers !== null &&
    capacityState.memberCount >= capacityState.maxMembers
  ) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "This group is already full."));
  }

  const membershipInsertResult = await insertGroupMember(
    capacityState.supabase,
    groupId,
    identity,
    "member",
  );

  if (
    membershipInsertResult.error &&
    isUniqueViolationError(membershipInsertResult.error)
  ) {
    redirect(
      buildRedirectUrl(redirectTo, successKey, "You already joined this group."),
    );
  }

  if (membershipInsertResult.error) {
    if (!authenticatedUser && isPermissionDeniedError(membershipInsertResult.error)) {
      await requireAuthenticatedUser({
        message:
          "Please log in to join groups once the auth migration is installed.",
        returnTo: redirectTo,
      });
    }

    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        `Could not join group: ${getSupabaseErrorMessage(
          membershipInsertResult.error,
          "Supabase returned an unknown error while joining the group.",
        )}`,
      ),
    );
  }

  const warnings: string[] = [];

  if (membershipInsertResult.missingAuthUserId) {
    warnings.push(
      "authenticated member tracking was not saved because auth_user_id is missing.",
    );
  }

  if (membershipInsertResult.missingRole) {
    warnings.push("the role column is missing.");
  }

  const successMessage =
    warnings.length > 0
      ? `Joined group successfully, but ${warnings.join(" ")} ${getAuthMigrationHintMessage()}`
      : "Joined group successfully.";

  revalidatePath("/supabase-test");
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  redirect(buildRedirectUrl(redirectTo, successKey, successMessage));
}
