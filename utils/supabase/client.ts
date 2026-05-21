import { createBrowserClient } from '@supabase/ssr';

// Fall back to placeholder strings so Next.js can complete its build-time
// static generation pass without env vars (Vercel build, local npm run build).
// Real values must still be set as env vars for auth/data to actually work.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-publishable-key';

export const createClient = () => createBrowserClient(supabaseUrl!, supabaseKey!);
