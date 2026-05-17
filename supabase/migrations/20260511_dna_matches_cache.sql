-- Cache AI-generated DNA match narratives to avoid duplicate Claude API calls
-- Each unique pair of fragrances is stored once (order-normalised via CHECK constraint)
CREATE TABLE IF NOT EXISTS public.dna_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fragrance_a_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  fragrance_b_id uuid NOT NULL REFERENCES public.fragrances(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  category text NOT NULL,
  narrative text NOT NULL,
  created_at timestamptz DEFAULT now(),
  -- Ensure A < B so (A,B) and (B,A) map to the same row
  CONSTRAINT dna_matches_order CHECK (fragrance_a_id < fragrance_b_id),
  CONSTRAINT dna_matches_unique_pair UNIQUE (fragrance_a_id, fragrance_b_id)
);

ALTER TABLE public.dna_matches ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached matches (they're not user-specific)
CREATE POLICY "dna_matches_select" ON public.dna_matches
  FOR SELECT USING (true);

-- Only service role can insert (via server-side API route)
CREATE POLICY "dna_matches_insert" ON public.dna_matches
  FOR INSERT WITH CHECK (true);
