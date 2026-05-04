"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { sendMessage } from "@/lib/supabase/messages";

export async function sendGroupMessage(formData: FormData) {
  const user = await requireAuthenticatedUser({
    message: "Please log in to send messages.",
    returnTo: "/messages",
  });

  const groupId = formData.get("group_id") as string;
  const content = formData.get("content") as string;

  if (!groupId || !content || content.trim().length === 0) {
    return { error: "Message content is required" };
  }

  if (content.length > 1000) {
    return { error: "Message is too long (max 1000 characters)" };
  }

  const { error } = await sendMessage(groupId, user.id, content);

  if (error) {
    return { error };
  }

  revalidatePath(`/messages/${groupId}`);
  return { success: true };
}