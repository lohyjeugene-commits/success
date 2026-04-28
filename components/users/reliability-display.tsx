import { getReliabilityLabel, formatRating, getStarDisplay } from "@/types/reliability";

type ReliabilityDisplayProps = {
  rating: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
};

export function ReliabilityDisplay({ 
  rating, 
  showLabel = true,
  size = "md" 
}: ReliabilityDisplayProps) {
  const { full, half, empty } = getStarDisplay(rating);
  const label = getReliabilityLabel(rating);
  
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  const starSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-0.5 ${starSizeClasses[size]}`}>
        {/* Full stars */}
        {Array.from({ length: full }).map((_, i) => (
          <span key={`full-${i}`} className="text-amber-400">★</span>
        ))}
        {/* Half star */}
        {half === 1 && <span className="text-amber-400">⯪</span>}
        {/* Empty stars */}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`empty-${i}`} className="text-slate-300">★</span>
        ))}
      </div>
      <span className={`font-medium text-slate-700 ${sizeClasses[size]}`}>
        {formatRating(rating)}
      </span>
      {showLabel && (
        <span className={`text-slate-500 ${sizeClasses[size]}`}>
          {label}
        </span>
      )}
    </div>
  );
}

type ReliabilityBadgeProps = {
  rating: number;
};

export function ReliabilityBadge({ rating }: ReliabilityBadgeProps) {
  const label = getReliabilityLabel(rating);
  
  const colorClasses = {
    "Very reliable": "bg-emerald-100 text-emerald-700",
    "Reliable": "bg-blue-100 text-blue-700",
    "Average": "bg-amber-100 text-amber-700",
    "Low reliability": "bg-rose-100 text-rose-700"
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[label]}`}>
      {formatRating(rating)} · {label}
    </span>
  );
}