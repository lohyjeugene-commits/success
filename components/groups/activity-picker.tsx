"use client";

import { useState } from "react";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITIES_BY_CATEGORY,
  getActivityPickerValue,
  resolveActivityCategory,
  type ActivityCategory,
} from "@/lib/constants/activity-categories";

type ActivityPickerProps = {
  activityCategoryId?: string;
  activityCategoryName?: string;
  activityTypeId?: string;
  activityTypeName?: string;
  activityCategoryLabel?: string;
  activityTypeLabel?: string;
  categoryPlaceholder?: string;
  activityPlaceholder?: string;
  emptyActivityOptionLabel?: string;
  defaultActivityCategory?: string | null;
  defaultActivityType?: string | null;
  required?: boolean;
};

type SelectableActivityCategory = ActivityCategory | "";

function hasTextValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function ActivityPicker({
  activityCategoryId = "activity_category",
  activityCategoryName = "activity_category",
  activityTypeId = "activity_type",
  activityTypeName = "activity_type",
  activityCategoryLabel = "Activity Category",
  activityTypeLabel = "Specific Activity",
  categoryPlaceholder = "Select a category",
  activityPlaceholder = "Choose a category first",
  emptyActivityOptionLabel = "Select an activity",
  defaultActivityCategory = null,
  defaultActivityType = null,
  required = true,
}: ActivityPickerProps) {
  const hasDefaultSelection =
    hasTextValue(defaultActivityCategory) || hasTextValue(defaultActivityType);
  const initialActivityCategory: SelectableActivityCategory =
    hasDefaultSelection
      ? resolveActivityCategory(defaultActivityCategory, defaultActivityType)
      : "";
  const initialActivityType =
    initialActivityCategory === ""
      ? ""
      : getActivityPickerValue(initialActivityCategory, defaultActivityType);
  const [activityCategory, setActivityCategory] =
    useState<SelectableActivityCategory>(initialActivityCategory);
  const [activityType, setActivityType] = useState(initialActivityType);
  const activityOptions =
    activityCategory === "" ? [] : ACTIVITIES_BY_CATEGORY[activityCategory];

  return (
    <>
      <div className="space-y-2">
        <label
          htmlFor={activityCategoryId}
          className="block text-sm font-medium text-slate-700"
        >
          {activityCategoryLabel}
        </label>
        <select
          id={activityCategoryId}
          name={activityCategoryName}
          required={required}
          value={activityCategory}
          onChange={(event) => {
            const nextActivityCategory = event.target
              .value as SelectableActivityCategory;

            setActivityCategory(nextActivityCategory);
            setActivityType("");
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">{categoryPlaceholder}</option>
          {ACTIVITY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={activityTypeId}
          className="block text-sm font-medium text-slate-700"
        >
          {activityTypeLabel}
        </label>
        <select
          id={activityTypeId}
          name={activityTypeName}
          required={required}
          disabled={activityCategory === ""}
          value={activityType}
          onChange={(event) => {
            setActivityType(event.target.value);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">
            {activityCategory === ""
              ? activityPlaceholder
              : emptyActivityOptionLabel}
          </option>
          {activityOptions.map((activity) => (
            <option key={activity} value={activity}>
              {activity}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
