"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getOrCreateTemporaryUserId } from "@/lib/server/temporary-user";

const allowedMaxMembers = new Set(["2", "3", "4", "5", "6", "8", "10"]);

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

function buildRedirectUrl(
  redirectTo: string,
  key: string,
  value: string,
) {
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

function isMissingMaxMembersError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    (message.includes("max_members") &&
      (message.includes("column") || message.includes("schema cache")))
  );
}

function isMissingColumnError(
  error: { code?: string; message?: string },
  columnName: string,
) {
  const message = error.message?.toLowerCase() ?? "";
  const lowerColumnName = columnName.toLowerCase();

  return (
    error.code === "42703" ||
    (message.includes(lowerColumnName) &&
      (message.includes("column") || message.includes("schema cache")))
  );
}

function isUniqueViolationError(error: { code?: string }) {
  return error.code === "23505";
}

async function getExistingMembershipState(
  supabase: ReturnType<typeof createSupabaseClient>,
  groupId: string,
  temporaryUserId: string,
) {
  const withUserIdResult = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", temporaryUserId);

  if (!withUserIdResult.error) {
    return {
      alreadyJoined: (withUserIdResult.count ?? 0) > 0,
      errorMessage: null,
    };
  }

  if (!isMissingColumnError(withUserIdResult.error, "user_id")) {
    return {
      alreadyJoined: false,
      errorMessage: `Could not check existing membership: ${withUserIdResult.error.message}`,
    };
  }

  const withNameResult = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("name", temporaryUserId);

  if (withNameResult.error) {
    return {
      alreadyJoined: false,
      errorMessage: `Could not check existing membership: ${withNameResult.error.message}`,
    };
  }

  return {
    alreadyJoined: (withNameResult.count ?? 0) > 0,
    errorMessage: null,
  };
}

async function getGroupCapacityState(groupId: string, temporaryUserId: string) {
  const supabase = createSupabaseClient();
  let maxMembers: number | null = null;

  const groupResult = await supabase
    .from("activity_groups")
    .select("id, max_members")
    .eq("id", groupId)
    .maybeSingle();

  if (groupResult.error && !isMissingMaxMembersError(groupResult.error)) {
    return {
      errorMessage: `Could not check group capacity: ${groupResult.error.message}`,
      maxMembers,
      memberCount: 0,
      supabase,
    };
  }

  if (!groupResult.error) {
    if (!groupResult.data) {
      return {
        errorMessage: "Could not join group: group not found.",
        maxMembers,
        memberCount: 0,
        supabase,
      };
    }

    maxMembers = groupResult.data.max_members;
  } else {
    const fallbackGroupResult = await supabase
      .from("activity_groups")
      .select("id")
      .eq("id", groupId)
      .maybeSingle();

    if (fallbackGroupResult.error) {
      return {
        errorMessage: `Could not check group capacity: ${fallbackGroupResult.error.message}`,
        maxMembers,
        memberCount: 0,
        supabase,
      };
    }

    if (!fallbackGroupResult.data) {
      return {
        errorMessage: "Could not join group: group not found.",
        maxMembers,
        memberCount: 0,
        supabase,
      };
    }
  }

  const memberCountResult = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (memberCountResult.error) {
    return {
      alreadyJoined: false,
      errorMessage: `Could not check current members: ${memberCountResult.error.message}`,
      maxMembers,
      memberCount: 0,
      supabase,
    };
  }

  const membershipState = await getExistingMembershipState(
    supabase,
    groupId,
    temporaryUserId,
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
  supabase: ReturnType<typeof createSupabaseClient>,
  groupId: string,
  temporaryUserId: string,
) {
  let insertResult = await supabase.from("group_members").insert([
    {
      group_id: groupId,
      name: "test user",
      user_id: temporaryUserId,
    },
  ]);

  if (insertResult.error && isMissingColumnError(insertResult.error, "user_id")) {
    insertResult = await supabase.from("group_members").insert([
      {
        group_id: groupId,
        name: temporaryUserId,
      },
    ]);
  }

  if (insertResult.error && isMissingColumnError(insertResult.error, "name")) {
    insertResult = await supabase.from("group_members").insert([
      {
        group_id: groupId,
        user_id: temporaryUserId,
      },
    ]);
  }

  return insertResult;
}

export async function createGroup(formData: FormData) {
  const title = getTextValue(formData, "title");
  const activityType = getTextValue(formData, "activity_type");
  const area = getTextValue(formData, "area");
  const maxMembers = getMaxMembersValue(formData);
  const { errorKey, redirectTo, successKey } = getRedirectConfig(formData, {
    errorKey: "createError",
    redirectTo: "/supabase-test",
    successKey: "createMessage",
  });

  if (!title || !activityType || !area) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "Please fill in all fields."));
  }

  const supabase = createSupabaseClient();

  let successMessage = "Group created successfully.";
  let { error } = await supabase.from("activity_groups").insert([
    {
      title,
      activity_type: activityType,
      area,
      max_members: maxMembers,
    },
  ]);

  if (error && isMissingMaxMembersError(error)) {
    const fallbackResult = await supabase.from("activity_groups").insert([
      {
        title,
        activity_type: activityType,
        area,
      },
    ]);

    error = fallbackResult.error;

    if (!error) {
      successMessage =
        "Group created, but max_members was not saved because the column is missing. Run the SQL in supabase/migrations/20260421_add_max_members_to_activity_groups.sql.";
    }
  }

  if (error) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        `Could not create group: ${error.message}`,
      ),
    );
  }

  revalidatePath("/supabase-test");
  revalidatePath("/groups");
  revalidatePath("/create-group");
  redirect(buildRedirectUrl(redirectTo, successKey, successMessage));
}

export async function joinGroup(formData: FormData) {
  const groupId = getTextValue(formData, "group_id");
  const { errorKey, redirectTo, successKey } = getRedirectConfig(formData, {
    errorKey: "joinError",
    redirectTo: "/supabase-test",
    successKey: "joinMessage",
  });

  if (!groupId) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "Missing group id."));
  }

  const temporaryUserId = await getOrCreateTemporaryUserId();
  const capacityState = await getGroupCapacityState(groupId, temporaryUserId);

  if (capacityState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, errorKey, capacityState.errorMessage));
  }

  if (capacityState.alreadyJoined) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "You already joined this group"));
  }

  if (
    capacityState.maxMembers !== null &&
    capacityState.memberCount >= capacityState.maxMembers
  ) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        "Could not join group: this group is already full.",
      ),
    );
  }

  const { error } = await insertGroupMember(
    capacityState.supabase,
    groupId,
    temporaryUserId,
  );

  if (error && isUniqueViolationError(error)) {
    redirect(buildRedirectUrl(redirectTo, errorKey, "You already joined this group"));
  }

  if (error) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        errorKey,
        `Could not join group: ${error.message}`,
      ),
    );
  }

  revalidatePath("/supabase-test");
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  redirect(
    buildRedirectUrl(
      redirectTo,
      successKey,
      "Joined group successfully.",
    ),
  );
}
