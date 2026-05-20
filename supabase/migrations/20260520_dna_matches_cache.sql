-- Migration: 20260520_dna_matches_cache.sql
-- Creates a cache table for DNA Match scores so repeated fragrance pairs
-- don't trigger a Claude API call each time.
--
-- Pair order is normalised in the API route (IDs sorted alphabetically)
-- so (A, B) and (B, A) always map to the same cache row.

create table if not exists dna_matches (
  id             uuid        primary key default gen_random_uuid(),
  fragrance_a_id uuid        not null references fragrances(id) on delete cascade,
  fragrance_b_id uuid        not null references fragrances(id) on delete cascade,
  score          integer     not null check (score between 0 and 100),
  category       text        not null,  -- "Virtually Twin" | "Strategic Inspiration" | etc.
  narrative      text        not null,  -- Claude-generated editorial prose
  created_at     timestamptz not null default now(),

  -- One cache row per ordered pair (order is normalised by the API route)
  constraint dna_matches_pair_unique unique (fragrance_a_id, fragrance_b_id)
);

-- Index for the lookup the API does on every request
create index if not exists dna_matches_pair_idx
  on dna_matches (fragrance_a_id, fragrance_b_id);

-- RLS: anyone can read cached results; only the service role can write
alter table dna_matches enable row level security;

create policy "Public read access on dna_matches"
  on dna_matches for select
  using (true);

-- Inserts are blocked for the anon/publishable key (service role bypasses RLS).
-- This means the first match for a pair goes uncached if you're not using a
-- service role client. Fine for MVP — add a service role server client later.
create policy "No public inserts on dna_matches"
  on dna_matches for insert
  with check (false);
