-- Fragrance Community: Database Schema
-- Paste this into the Supabase SQL Editor and click Run
-- https://supabase.com/dashboard/project/uwysupjxhsuvzxgqvxdh/sql/new

-- ─── Table: fragrances ───────────────────────────────────────────────────────
-- Each row is one fragrance a user has added to their personal library.
-- user_id links to the built-in auth.users table that Supabase manages.
-- is_public = true means the entry shows up in the Community feed.

CREATE TABLE fragrances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  name       text NOT NULL,
  brand      text,
  notes      text,           -- freeform tasting notes / impressions
  rating     integer CHECK (rating >= 1 AND rating <= 5),
  is_public  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- RLS means rows are invisible by default — we opt in via policies below.
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;

-- Logged-in users can see their own fragrances, even private ones.
-- Unauthenticated visitors can see any fragrance marked is_public = true.
CREATE POLICY "Read fragrances"
  ON fragrances FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can only insert rows where user_id matches their own account.
CREATE POLICY "Insert own fragrances"
  ON fragrances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own fragrances.
CREATE POLICY "Delete own fragrances"
  ON fragrances FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only update their own fragrances.
CREATE POLICY "Update own fragrances"
  ON fragrances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
