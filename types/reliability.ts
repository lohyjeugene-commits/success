export type UserReliabilityRow = {
  user_id: string;
  attended_count: number;
  no_show_count: number;
  cancelled_count: number;
  rating: number;
  updated_at: string;
};

export type ReliabilityLabel = "Very reliable" | "Reliable" | "Average" | "Low reliability";

export function getReliabilityLabel(rating: number): ReliabilityLabel {
  if (rating >= 4.5) return "Very reliable";
  if (rating >= 3.5) return "Reliable";
  if (rating >= 2.5) return "Average";
  return "Low reliability";
}

export function formatRating(rating: number): string {
  return `${rating.toFixed(1)}⭐`;
}

export function getStarDisplay(rating: number): { full: number; half: number; empty: number } {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}