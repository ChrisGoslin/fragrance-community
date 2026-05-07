// Shared TypeScript types used across multiple pages.
// When you change the database schema, update this file and TypeScript
// will tell you everywhere in the app that needs updating.

import type { Session } from "@supabase/supabase-js";

// A row from the `fragrances` table
export interface Fragrance {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  notes: string | null;
  rating: number | null;
  is_public: boolean;
  created_at: string;
}

// Re-export Session so pages can import it from one place
export type { Session };
