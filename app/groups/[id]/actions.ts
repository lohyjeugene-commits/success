"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import {
  isMissingColumnError,
  isMissingTableError,
  isUniqueViolationError,
} from "@/lib/supabase/errors";
import { getOrCreateTemporaryIdentity } from "@/lib/server/temporary-user";
import {
  canUserManageGroup,
  getMembershipStateForUser,
} from "@/lib/supabase/memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function getDetailsRedirectPath(groupId: string, formData: FormData) {
  return getTextValue(formData, "redirect_to") || `/groups/${groupId}`;
}

function getMigrationHintMessage() {
  return "Run the SQL in supabase/migrations/20260422_add_auth_profiles_permissions_and_dashboard.sql.";
}

async function getSlotGroupId(
  supabase: SupabaseClient,
  slotId: string,
) {
  const slotResult = await supabase
    .from("meetup_slots")
    .select("group_id")
    .eq("id", slotId)
    .maybeSingle();

  if (slotResult.error) {
    return {
      errorMessage: isMissingTableError(slotResult.error)
        ? `Could not load meetup slot because the required tables are missing. ${getMigrationHintMessage()}`
        : `Could not load meetup slot: ${slotResult.error.message}`,
      groupId: null,
    };
  }

  if (!slotResult.data) {
    return {
      errorMessage: "Could not find that meetup slot.",
      groupId: null,
    };
  }

  return {
    errorMessage: null,
    groupId: slotResult.data.group_id,
  };
}

async function insertAvailabilityVote(
  supabase: SupabaseClient,
  slotId: string,
  userId: string,
) {
  const insertPayload: {
    slot_id: string;
    user_id?: string;
  } = {
    slot_id: slotId,
    user_id: userId,
  };

  while (true) {
    const insertResult = await supabase.from("availability_votes").insert([
      insertPayload,
    ]);

    if (!insertResult.error) {
      return {
        error: null,
      };
    }

    if (isMissingColumnError(insertResult.error, "user_id")) {
      delete insertPayload.user_id;
      continue;
    }

    return {
      error: insertResult.error,
    };
  }
}

async function hasExistingAvailabilityVote(
  supabase: SupabaseClient,
  slotId: string,
  userId: string,
) {
  const userIdResult = await supabase
    .from("availability_votes")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .eq("user_id", userId);

  if (!userIdResult.error) {
    return {
      alreadyVoted: (userIdResult.count ?? 0) > 0,
      errorMessage: null,
    };
  }

  if (!isMissingColumnError(userIdResult.error, "user_id")) {
    return {
      alreadyVoted: false,
      errorMessage: `Could not check availability vote: ${userIdResult.error.message}`,
    };
  }

  return {
    alreadyVoted: false,
    errorMessage: null,
  };
}

async function getTemporaryMembershipState(
  supabase: SupabaseClient,
  groupId: string,
  temporaryUserId: string,
) {
  const membershipResult = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", temporaryUserId);

  if (!membershipResult.error) {
    return {
      errorMessage: null,
      isMember: (membershipResult.count ?? 0) > 0,
    };
  }

  if (!isMissingColumnError(membershipResult.error, "user_id")) {
    return {
      errorMessage: `Could not check group membership: ${membershipResult.error.message}`,
      isMember: false,
    };
  }

  return {
    errorMessage: null,
    isMember: false,
  };
}

export async function createMeetupSlot(formData: FormData) {
  const groupId = getTextValue(formData, "group_id");
  const redirectTo = getDetailsRedirectPath(groupId, formData);
  const startsAt = getTextValue(formData, "starts_at");
  const endsAt = getTextValue(formData, "ends_at");

  if (!groupId || !startsAt || !endsAt) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "Please fill in both date and time fields.",
      ),
    );
  }

  const user = await requireAuthenticatedUser({
    message: "Please log in to manage meetup slots.",
    returnTo: redirectTo,
  });
  const supabase = await createSupabaseServerClient();
  const managerState = await canUserManageGroup(supabase, groupId, user.id);

  if (managerState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, "error", managerState.errorMessage));
  }

  if (!managerState.canManage) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "Only group creators or admins can create meetup slots.",
      ),
    );
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "End date and time must be after the start date and time.",
      ),
    );
  }

  const { error } = await supabase.from("meetup_slots").insert([
    {
      group_id: groupId,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    },
  ]);

  if (error) {
    const errorMessage = isMissingTableError(error)
      ? `Could not create meetup slot because the required tables are missing. ${getMigrationHintMessage()}`
      : `Could not create meetup slot: ${error.message}`;

    redirect(buildRedirectUrl(redirectTo, "error", errorMessage));
  }

  revalidatePath(redirectTo);
  revalidatePath("/dashboard");
  redirect(buildRedirectUrl(redirectTo, "message", "Meetup slot created."));
}

export async function voteAvailability(formData: FormData) {
  const groupId = getTextValue(formData, "group_id");
  const slotId = getTextValue(formData, "slot_id");
  const providedDisplayName = getTextValue(formData, "display_name");
  const redirectTo = getDetailsRedirectPath(groupId, formData);

  if (!groupId || !slotId) {
    redirect(buildRedirectUrl(redirectTo, "error", "Missing slot information."));
  }

  const identity = await getOrCreateTemporaryIdentity(providedDisplayName);

  if (identity.missingDisplayName) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "Please choose a display name before voting on a meetup slot.",
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const membershipState = await getTemporaryMembershipState(
    supabase,
    groupId,
    identity.temporaryUserId,
  );

  if (membershipState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, "error", membershipState.errorMessage));
  }

  if (!membershipState.isMember) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "You need to join this group before voting on meetup slots.",
      ),
    );
  }

  const existingVoteState = await hasExistingAvailabilityVote(
    supabase,
    slotId,
    identity.temporaryUserId,
  );

  if (existingVoteState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, "error", existingVoteState.errorMessage));
  }

  if (existingVoteState.alreadyVoted) {
    redirect(buildRedirectUrl(redirectTo, "error", "You already voted for this slot"));
  }

  const insertResult = await insertAvailabilityVote(
    supabase,
    slotId,
    identity.temporaryUserId,
  );

  if (insertResult.error && isUniqueViolationError(insertResult.error)) {
    redirect(buildRedirectUrl(redirectTo, "error", "You already voted for this slot"));
  }

  if (insertResult.error) {
    const errorMessage =
      isMissingTableError(insertResult.error) ||
      isMissingColumnError(insertResult.error, "user_id")
        ? `Could not save availability vote because the required tables are missing or incomplete. ${getMigrationHintMessage()}`
        : `Could not save availability vote: ${insertResult.error.message}`;

    redirect(buildRedirectUrl(redirectTo, "error", errorMessage));
  }

  revalidatePath(redirectTo);
  revalidatePath("/dashboard");
  redirect(buildRedirectUrl(redirectTo, "message", "Availability saved."));
}

export async function acceptSlotInvite(formData: FormData) {
  const slotId = getTextValue(formData, "slot_id");
  const explicitRedirectTo = getTextValue(formData, "redirect_to");

  if (!slotId) {
    redirect(buildRedirectUrl("/dashboard", "error", "Missing slot information."));
  }

  const user = await requireAuthenticatedUser({
    message: "Please log in to accept meetup invites.",
    returnTo: explicitRedirectTo || "/dashboard",
  });
  const supabase = await createSupabaseServerClient();
  const slotState = await getSlotGroupId(supabase, slotId);
  const redirectTo = explicitRedirectTo || (slotState.groupId ? `/groups/${slotState.groupId}` : "/dashboard");

  if (slotState.errorMessage || !slotState.groupId) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        slotState.errorMessage ?? "Could not find that meetup slot.",
      ),
    );
  }

  const membershipState = await getMembershipStateForUser(
    supabase,
    slotState.groupId,
    user.id,
  );

  if (membershipState.errorMessage) {
    redirect(buildRedirectUrl(redirectTo, "error", membershipState.errorMessage));
  }

  if (!membershipState.isMember) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        "You need to join this group before accepting meetup invites.",
      ),
    );
  }

  const { error } = await supabase.from("slot_acceptances").insert([
    {
      slot_id: slotId,
      user_id: user.id,
    },
  ]);

  if (error && isUniqueViolationError(error)) {
    redirect(buildRedirectUrl(redirectTo, "error", "You already accepted this meetup invite."));
  }

  if (error) {
    const errorMessage = isMissingTableError(error)
      ? `Could not accept the meetup invite because the required tables are missing. ${getMigrationHintMessage()}`
      : `Could not accept the meetup invite: ${error.message}`;

    redirect(buildRedirectUrl(redirectTo, "error", errorMessage));
  }

  revalidatePath(redirectTo);
  revalidatePath("/dashboard");
  redirect(buildRedirectUrl(redirectTo, "message", "Meetup invite accepted."));
}
