import { createSupabaseServerClient } from "./server";
import type { ActivityGroupRow } from "@/types/group";

export type MatchPreference = {
  activityType?: string;
  area?: string;
  preferredSize?: number;
};

type MatchedGroup = ActivityGroupRow & {
  matchScore: number;
  matchReason: string;
};

export async function findMatchingGroups(
  preference: MatchPreference
): Promise<{ groups: MatchedGroup[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  
  // Build base query
  let query = supabase
    .from("activity_groups")
    .select("id, title, activity_type, area, max_members");
  
  // Apply filters
  if (preference.activityType && preference.activityType.trim() !== "") {
    query = query.ilike("activity_type", `%${preference.activityType.trim()}%`);
  }
  
  if (preference.area && preference.area.trim() !== "") {
    query = query.eq("area", preference.area.trim());
  }
  
  const result = await query;
  
  if (result.error) {
    return { groups: [], error: result.error.message };
  }
  
  // Get member counts
  const memberResult = await supabase
    .from("group_members")
    .select("group_id");
  
  if (memberResult.error) {
    return { groups: [], error: memberResult.error };
  }
  
  // Calculate member counts per group
  const memberCounts = new Map<string, number>();
  for (const m of memberResult.data ?? []) {
    memberCounts.set(
      m.group_id,
      (memberCounts.get(m.group_id) ?? 0) + 1
    );
  }
  
  // Add member counts and filter for available spots
  const groupsWithCounts: ActivityGroupRow[] = (result.data ?? []).map(g => ({
    ...g,
    current_member_count: memberCounts.get(g.id) ?? 0
  })).filter(g => 
    g.max_members === null || g.current_member_count < g.max_members
  );
  
  // Score and sort groups
  const scoredGroups = groupsWithCounts.map(group => {
    let score = 0;
    const reasons: string[] = [];
    
    // Prefer groups closer to full (but not full)
    if (group.max_members !== null) {
      const fillRatio = group.current_member_count / group.max_members;
      if (fillRatio >= 0.5 && fillRatio < 1) {
        score += 30 * fillRatio;
        reasons.push("Almost full");
      }
    }
    
    // Prefer groups with more members
    score += group.current_member_count * 5;
    if (group.current_member_count > 0) {
      reasons.push(`${group.current_member_count} member${group.current_member_count > 1 ? 's' : ''}`);
    }
    
    // Prefer exact size match
    if (preference.preferredSize && group.max_members === preference.preferredSize) {
      score += 20;
      reasons.push("Perfect size");
    }
    
    // Bonus for exact activity match
    if (preference.activityType && 
        group.activity_type.toLowerCase() === preference.activityType.toLowerCase().trim()) {
      score += 15;
      reasons.push("Exact activity");
    }
    
    // Bonus for exact area match
    if (preference.area && group.area === preference.area) {
      score += 10;
    }
    
    return {
      ...group,
      matchScore: score,
      matchReason: reasons.join(", ") || "Available group"
    };
  });
  
  // Sort by score descending
  scoredGroups.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top 10 matches
  return { 
    groups: scoredGroups.slice(0, 10), 
    error: null 
  };
}