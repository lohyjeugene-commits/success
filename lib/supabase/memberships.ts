import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError } from "./errors";

export type MembershipRole = "admin" | "creator" | "member";

type MembershipRow = {
  group_id: string;
  role?: MembershipRole | null;
};

type MembershipRowsResult = {
  errorMessage: string | null;
  memberships: MembershipRow[];
};

async function selectMembershipRows(
  supabase: SupabaseClient,
  userId: string,
): Promise<MembershipRowsResult> {
  const withAuthUserIdResult = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("auth_user_id", userId);

  if (!withAuthUserIdResult.error) {
    return {
      errorMessage: null,
      memberships: (withAuthUserIdResult.data ?? []) as MembershipRow[],
    };
  }

  if (
    !isMissingColumnError(withAuthUserIdResult.error, "auth_user_id") &&
    !isMissingColumnError(withAuthUserIdResult.error, "role")
  ) {
    return {
      errorMessage: `Could not load memberships: ${withAuthUserIdResult.error.message}`,
      memberships: [],
    };
  }

  const fallbackWithRoleResult = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", userId);

  if (!fallbackWithRoleResult.error) {
    return {
      errorMessage: null,
      memberships: (fallbackWithRoleResult.data ?? []) as MembershipRow[],
    };
  }

  if (!isMissingColumnError(fallbackWithRoleResult.error, "role")) {
    return {
      errorMessage: `Could not load memberships: ${fallbackWithRoleResult.error.message}`,
      memberships: [],
    };
  }

  const fallbackResult = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (fallbackResult.error) {
    return {
      errorMessage: `Could not load memberships: ${fallbackResult.error.message}`,
      memberships: [],
    };
  }

  return {
    errorMessage: null,
    memberships: ((fallbackResult.data ?? []) as { group_id: string }[]).map(
      (membership) => ({
        ...membership,
        role: "member",
      }),
    ),
  };
}

export async function getMembershipStateForUser(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
) {
  const membershipRowsResult = await selectMembershipRows(supabase, userId);

  if (membershipRowsResult.errorMessage) {
    return {
      errorMessage: membershipRowsResult.errorMessage,
      isMember: false,
      role: null,
    };
  }

  const membership = membershipRowsResult.memberships.find(
    (item) => item.group_id === groupId,
  );

  return {
    errorMessage: null,
    isMember: Boolean(membership),
    role: membership?.role ?? null,
  };
}

export async function getMembershipsForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  return selectMembershipRows(supabase, userId);
}

export async function canUserManageGroup(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
) {
  const groupResult = await supabase
    .from("activity_groups")
    .select("creator_user_id")
    .eq("id", groupId)
    .maybeSingle();

  if (
    groupResult.error &&
    !isMissingColumnError(groupResult.error, "creator_user_id")
  ) {
    return {
      canManage: false,
      errorMessage: `Could not check group permissions: ${groupResult.error.message}`,
      role: null,
    };
  }

  if (!groupResult.error && !groupResult.data) {
    return {
      canManage: false,
      errorMessage: "Group not found.",
      role: null,
    };
  }

  if (!groupResult.error && groupResult.data?.creator_user_id === userId) {
    return {
      canManage: true,
      errorMessage: null,
      role: "creator" as const,
    };
  }

  const membershipState = await getMembershipStateForUser(supabase, groupId, userId);

  if (membershipState.errorMessage) {
    return {
      canManage: false,
      errorMessage: membershipState.errorMessage,
      role: null,
    };
  }

  return {
    canManage:
      membershipState.role === "admin" || membershipState.role === "creator",
    errorMessage: null,
    role: membershipState.role,
  };
}
