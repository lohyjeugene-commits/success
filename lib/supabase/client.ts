import { createClient } from "@supabase/supabase-js";

type SupabaseEnvironment = {
  keySource:
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
  supabaseKey: string;
  supabaseUrl: string;
};

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }

  if (publishableKey) {
    return {
      keySource: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      supabaseKey: publishableKey,
      supabaseUrl,
    };
  }

  if (anonKey) {
    return {
      keySource: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      supabaseKey: anonKey,
      supabaseUrl,
    };
  }

  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
}

export function createSupabaseClient() {
  const { supabaseKey, supabaseUrl } = getSupabaseEnvironment();

  return createClient(supabaseUrl, supabaseKey);
}
