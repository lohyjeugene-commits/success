type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export function isMissingColumnError(
  error: SupabaseLikeError,
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

export function isMissingTableError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

export function isUniqueViolationError(error: SupabaseLikeError) {
  return error.code === "23505";
}

export function isPermissionDeniedError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("violates row-level security")
  );
}

export function isMissingMaxMembersError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    (message.includes("max_members") &&
      (message.includes("column") || message.includes("schema cache")))
  );
}
