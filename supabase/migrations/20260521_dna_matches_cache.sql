-- DNA Match cache table
-- Stores computed matching scores between fragrance pairs
-- Pair order is normalised via the API (A,B) and (B,A) map to the same row

create table if not exists dna_matches (
  id uuid primary key default gen_random_uuid(),
  fragrance_a_id uuid not null references fragrances(id) on delete cascade,
  fragrance_b_id uuid not null references fragrances(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  category text not null,
  narrative text not null,
  created_at timestamptz not null default now(),
  constraint dna_matches_pair_unique unique (fragrance_a_id, fragrance_b_id)
);

alter table dna_matches enable row level security;

-- Anyone can read cached matches
create policy "dna_matches: public read" on dna_matches for select using (true);

-- Service role only (from API)
create policy "dna_matches: service insert only" on dna_matches for insert with check (false);
