import { createSupabaseServerClient } from "./server";
import type { UserReliabilityRow } from "@/types/reliability";

export async function getUserRating(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc("get_user_rating", { p_user_id: userId });
  
  if (error || !data) {
    return 5.0;
  }
  
  return data;
}

export async function getUserReliability(userId: string): Promise<UserReliabilityRow | null> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("user_reliability")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function getMultipleUserRatings(userIds: string[]): Promise<Map<string, number>> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("user_reliability")
    .select("user_id, rating")
    .in("user_id", userIds);
  
  const ratingMap = new Map<string, number>();
  
  if (error || !data) {
    // Default all to 5.0
    userIds.forEach(id => ratingMap.set(id, 5.0));
    return ratingMap;
  }
  
  // Default missing to 5.0
  userIds.forEach(id => ratingMap.set(id, 5.0));
  data.forEach(row => ratingMap.set(row.user_id, row.rating));
  
  return ratingMap;
}

export async function updateUserReliability(
  userId: string,
  eventType: "attended" | "no_show" | "cancelled"
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .rpc("update_user_reliability", {
      p_user_id: userId,
      p_event_type: eventType
    });
  
  return !error;
}