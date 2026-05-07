import { createClient } from "@supabase/supabase-js";

// Validate at module load time so a missing .env.local gives a clear error
// message ("Missing NEXT_PUBLIC_SUPABASE_URL") instead of a cryptic
// "Cannot read properties of undefined" crash somewhere downstream.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local"
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — add it to .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
