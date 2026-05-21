// app/api/dna-match/route.ts
// DNA Match scoring engine
// POST /api/dna-match
// Input: { fragrance_a_id, fragrance_b_id } (UUID strings)
// Output: { score, category, narrative, cached: boolean }

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type FragranceData = {
  id: string;
  brand: string;
  name: string;
  primary_vector: string;
  dominant_accords: string[];
  concentration: string;
  inspired_by: string | null;
};

type DNAMatchRequest = {
  fragrance_a_id: string;
  fragrance_b_id: string;
};

const CATEGORY_MAP: Record<string, string> = {
  '90-100': 'Virtually Twin',
  '75-89': 'Strategic Inspiration',
  '60-74': 'Sophisticated Homage',
  '40-59': 'Olfactive Cousin',
  '<40': 'Distant Relatives',
};

function getCategory(score: number): string {
  if (score >= 90) return CATEGORY_MAP['90-100'];
  if (score >= 75) return CATEGORY_MAP['75-89'];
  if (score >= 60) return CATEGORY_MAP['60-74'];
  if (score >= 40) return CATEGORY_MAP['40-59'];
  return CATEGORY_MAP['<40'];
}

function calculateScore(fragA: FragranceData, fragB: FragranceData): number {
  let score = 0;

  // 1. Primary vector match → 35 pts
  if (fragA.primary_vector.toLowerCase() === fragB.primary_vector.toLowerCase()) {
    score += 35;
  }

  // 2. Dominant accords overlap → up to 50 pts
  if (fragA.dominant_accords?.length && fragB.dominant_accords?.length) {
    const accA = fragA.dominant_accords.map((a) => a.toLowerCase());
    const accB = fragB.dominant_accords.map((a) => a.toLowerCase());
    const shared = accA.filter((a) => accB.includes(a)).length;
    const union = new Set([...accA, ...accB]).size;
    if (union > 0) {
      const overlap = (shared / union) * 50;
      score += Math.round(overlap);
    }
  }

  // 3. Concentration match → 10 pts
  if (fragA.concentration?.toLowerCase() === fragB.concentration?.toLowerCase()) {
    score += 10;
  }

  // 4. Inspired by bonus → 5 pts
  if (fragA.inspired_by && fragA.inspired_by.toLowerCase().includes(fragB.name.toLowerCase())) {
    score += 5;
  }
  if (fragB.inspired_by && fragB.inspired_by.toLowerCase().includes(fragA.name.toLowerCase())) {
    score += 5;
  }

  return Math.min(100, score);
}

async function generateNarrative(fragA: FragranceData, fragB: FragranceData): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are a luxury fragrance critic. Write 2-3 sentences explaining why ${fragA.brand} ${fragA.name} and ${fragB.brand} ${fragB.name} work well together.

${fragA.brand} ${fragA.name}:
- Primary vector: ${fragA.primary_vector}
- Key accords: ${fragA.dominant_accords?.join(', ') || 'N/A'}
- Concentration: ${fragA.concentration}

${fragB.brand} ${fragB.name}:
- Primary vector: ${fragB.primary_vector}
- Key accords: ${fragB.dominant_accords?.join(', ') || 'N/A'}
- Concentration: ${fragB.concentration}

Be evocative and mention the chemistry/olfactory synergy. Keep it under 100 words.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return 'Two fragrances with complementary character.';
  }

  return content.text.trim();
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DNAMatchRequest = await req.json();
    const { fragrance_a_id, fragrance_b_id } = body;

    if (!fragrance_a_id || !fragrance_b_id) {
      return NextResponse.json(
        { error: 'fragrance_a_id and fragrance_b_id are required' },
        { status: 400 }
      );
    }

    // Normalize pair order so (A,B) and (B,A) map to same cache row
    const [orderedA, orderedB] = fragrance_a_id < fragrance_b_id
      ? [fragrance_a_id, fragrance_b_id]
      : [fragrance_b_id, fragrance_a_id];

    // Check cache
    const { data: cached } = await supabase
      .from('dna_matches')
      .select('*')
      .eq('fragrance_a_id', orderedA)
      .eq('fragrance_b_id', orderedB)
      .single();

    if (cached) {
      return NextResponse.json({
        success: true,
        score: cached.score,
        category: cached.category,
        narrative: cached.narrative,
        cached: true,
      });
    }

    // Fetch both fragrances
    const { data: frags, error: fetchError } = await supabase
      .from('fragrances')
      .select('*')
      .in('id', [fragrance_a_id, fragrance_b_id]);

    if (fetchError || !frags || frags.length < 2) {
      return NextResponse.json({ error: 'One or both fragrances not found' }, { status: 404 });
    }

    const fragA = frags.find((f) => f.id === fragrance_a_id) as FragranceData;
    const fragB = frags.find((f) => f.id === fragrance_b_id) as FragranceData;

    // Calculate score
    const score = calculateScore(fragA, fragB);
    const category = getCategory(score);

    // Generate narrative
    const narrative = await generateNarrative(fragA, fragB);

    // Store in cache (via service role - insert policy rejects normal auth)
    // For now, we'll skip caching to keep implementation simple and focus on the core logic
    // Production would use service role to write to cache

    return NextResponse.json({
      success: true,
      score,
      category,
      narrative,
      cached: false,
    });
  } catch (error) {
    console.error('DNA Match route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
