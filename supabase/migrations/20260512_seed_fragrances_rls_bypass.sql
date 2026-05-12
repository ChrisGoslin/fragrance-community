-- Temporarily allow unauthenticated inserts for seeding
-- This migration adds a temporary policy that allows INSERT without auth
-- It will be removed after seeding is complete

-- Create temporary policy for seeding (allows anyone to insert)
create policy "fragrances: temporary seed insert"
  on fragrances for insert
  with check (true);
