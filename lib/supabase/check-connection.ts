import { createSupabaseClient } from "@/lib/supabase/client";

type SupabaseConnectionResult = {
  connected: boolean;
  details: string;
  headline: string;
};

const TEST_TABLE_NAME = "_touchgrass_connection_check";

function isExpectedMissingTableError(error: {
  code?: string;
  message?: string;
}) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("could not find the table") ||
    message.includes("does not exist")
  );
}

export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from(TEST_TABLE_NAME)
      .select("*")
      .limit(1);

    if (!error) {
      return {
        connected: true,
        details: "Supabase answered the test query successfully.",
        headline: "Supabase is connected.",
      };
    }

    if (isExpectedMissingTableError(error)) {
      return {
        connected: true,
        details:
          "Supabase answered the request. The temporary test table does not exist yet, which is expected because the database schema has not been created.",
        headline: "Supabase is connected.",
      };
    }

    return {
      connected: false,
      details: error.message,
      headline: "Supabase responded with an unexpected error.",
    };
  } catch (error) {
    return {
      connected: false,
      details:
        error instanceof Error ? error.message : "Unknown connection error.",
      headline: "Could not create the Supabase client.",
    };
  }
}
