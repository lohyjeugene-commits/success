"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getOrCreateTemporaryUserId } from "@/lib/server/temporary-user";

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

function isMissingTableError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function isUniqueViolationError(error: { code?: string }) {
  return error.code === "23505";
}

function getDetailsRedirectPath(groupId: string, formData: FormData) {
  return getTextValue(formData, "redirect_to") || `/groups/${groupId}`;
}

function getMigrationHintMessage() {
  return "Run the SQL in supabase/migrations/20260422_create_meetup_slots_and_availability_votes.sql.";
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

  const supabase = createSupabaseClient();
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
  redirect(buildRedirectUrl(redirectTo, "message", "Meetup slot created."));
}

export async function voteAvailability(formData: FormData) {
  const groupId = getTextValue(formData, "group_id");
  const slotId = getTextValue(formData, "slot_id");
  const redirectTo = getDetailsRedirectPath(groupId, formData);

  if (!groupId || !slotId) {
    redirect(buildRedirectUrl(redirectTo, "error", "Missing slot information."));
  }

  const temporaryUserId = await getOrCreateTemporaryUserId();
  const supabase = createSupabaseClient();

  const existingVoteResult = await supabase
    .from("availability_votes")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .eq("user_id", temporaryUserId);

  if (existingVoteResult.error && !isMissingTableError(existingVoteResult.error)) {
    redirect(
      buildRedirectUrl(
        redirectTo,
        "error",
        `Could not check availability vote: ${existingVoteResult.error.message}`,
      ),
    );
  }

  if ((existingVoteResult.count ?? 0) > 0) {
    redirect(buildRedirectUrl(redirectTo, "error", "You already voted for this slot"));
  }

  const { error } = await supabase.from("availability_votes").insert([
    {
      slot_id: slotId,
      user_id: temporaryUserId,
    },
  ]);

  if (error && isUniqueViolationError(error)) {
    redirect(buildRedirectUrl(redirectTo, "error", "You already voted for this slot"));
  }

  if (error) {
    const errorMessage =
      isMissingTableError(error) || isMissingColumnError(error, "user_id")
        ? `Could not save availability vote because the required tables are missing or incomplete. ${getMigrationHintMessage()}`
        : `Could not save availability vote: ${error.message}`;

    redirect(buildRedirectUrl(redirectTo, "error", errorMessage));
  }

  revalidatePath(redirectTo);
  redirect(buildRedirectUrl(redirectTo, "message", "Availability saved."));
}
