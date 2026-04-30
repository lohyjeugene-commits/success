export type ActivityCategory =
  | "Creatives & Hobbies"
  | "Chill & Hangout"
  | "Gaming & Online"
  | "Outdoor & Exploration"
  | "Self Improvement"
  | "Social & Events"
  | "Sports & Fitness"
  | "Study & Productivity"
  | "Other";

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "Chill & Hangout",
  "Creatives & Hobbies",
  "Gaming & Online",
  "Outdoor & Exploration",
  "Self Improvement",
  "Social & Events",
  "Sports & Fitness",
  "Study & Productivity",
  "Other",
];

export const ACTIVITIES_BY_CATEGORY: Record<ActivityCategory, string[]> = {
  "Chill & Hangout": [
    "Cafe Hopping",
    "Casual Chat",
    "Food Hunt",
    "Karaoke",
    "Movie",
    "Shopping",
    "Supper",
    "Window Shopping",
    "Other",
  ],

  "Creatives & Hobbies": [
    "Calligraphy",
    "Crafts",
    "Crochet",
    "Drawing",
    "Embroidery",
    "Knitting",
    "Painting",
    "Photography",
    "Pottery",
    "Sculpting",
    "Sewing",
    "Sketching",
    "Videography",
    "Other",
  ],

  "Gaming & Online": [
    "Board Games",
    "Chess",
    "Console Gaming",
    "Dungeons & Dragons",
    "LAN Gaming",
    "Mobile Gaming",
    "Online Chat",
    "PC Gaming",
    "Tabletop Games",
    "Other",
  ],

  "Outdoor & Exploration": [
    "Beach",
    "Camping",
    "Cycling",
    "Exploring Neighbourhoods",
    "Hiking",
    "Nature Walk",
    "Picnic",
    "Skating",
    "Urban Exploring",
    "Walking",
    "Other",
  ],

  "Self Improvement": [
    "Book Club",
    "Career Talk",
    "Coding",
    "Finance Discussion",
    "Language Learning",
    "Networking",
    "Public Speaking",
    "Reading",
    "Skill Swap",
    "Other",
  ],

  "Social & Events": [
    "Festival",
    "Group Dinner",
    "Meet New Friends",
    "Museum Visit",
    "Networking Event",
    "Party",
    "Volunteer Activity",
    "Workshop",
    "Other",
  ],

  "Sports & Fitness": [
    "Badminton",
    "Basketball",
    "Climbing",
    "Dance",
    "Football",
    "Gym",
    "Running",
    "Swimming",
    "Table Tennis",
    "Tennis",
    "Volleyball",
    "Yoga",
    "Other",
  ],

  "Study & Productivity": [
    "Accountability Session",
    "Co-working",
    "Exam Revision",
    "Group Study",
    "Homework",
    "Library Study",
    "Project Work",
    "Quiet Study",
    "Study Cafe",
    "Other",
  ],

  Other: ["Other"],
};

const ACTIVITY_CATEGORY_SET = new Set<ActivityCategory>(ACTIVITY_CATEGORIES);

export const OTHER_ACTIVITY = "Other";

export function isActivityCategory(
  value: string | null | undefined,
): value is ActivityCategory {
  if (!value) {
    return false;
  }

  return ACTIVITY_CATEGORY_SET.has(value as ActivityCategory);
}

export function getActivitiesForCategory(category: ActivityCategory) {
  return ACTIVITIES_BY_CATEGORY[category];
}

export function isActivityInCategory(
  category: ActivityCategory,
  activityType: string | null | undefined,
) {
  if (!activityType) {
    return false;
  }

  return getActivitiesForCategory(category).includes(activityType.trim());
}

export function normalizeActivityType(activityType: string | null | undefined) {
  return activityType?.trim() || OTHER_ACTIVITY;
}

export function inferActivityCategory(
  activityType: string | null | undefined,
): ActivityCategory {
  const normalizedActivityType = normalizeActivityType(activityType);

  for (const category of ACTIVITY_CATEGORIES) {
    if (category === "Other") {
      continue;
    }

    if (ACTIVITIES_BY_CATEGORY[category].includes(normalizedActivityType)) {
      return category;
    }
  }

  return "Other";
}

export function resolveActivityCategory(
  activityCategory: string | null | undefined,
  activityType: string | null | undefined,
): ActivityCategory {
  if (isActivityCategory(activityCategory)) {
    return activityCategory;
  }

  return inferActivityCategory(activityType);
}

export function resolveActivitySelection(
  activityCategory: string | null | undefined,
  activityType: string | null | undefined,
) {
  const resolvedActivityType = normalizeActivityType(activityType);

  return {
    activity_category: resolveActivityCategory(
      activityCategory,
      resolvedActivityType,
    ),
    activity_type: resolvedActivityType,
  };
}

export function getActivityPickerValue(
  activityCategory: ActivityCategory,
  activityType: string | null | undefined,
) {
  const normalizedActivityType = normalizeActivityType(activityType);

  return isActivityInCategory(activityCategory, normalizedActivityType)
    ? normalizedActivityType
    : OTHER_ACTIVITY;
}

export function formatActivitySummary(
  activityCategory: string | null | undefined,
  activityType: string | null | undefined,
) {
  const selection = resolveActivitySelection(activityCategory, activityType);

  return selection.activity_category === selection.activity_type
    ? selection.activity_type
    : `${selection.activity_category} · ${selection.activity_type}`;
}
