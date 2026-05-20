// app/api/dna-match/route.ts
// POST /api/dna-match
// Input:  { fragrance_a_id: string, fragrance_b_id: string }
// Output: { score: number, category: string, narrative: string, cached: boolean }
//
// How it works:
//  1. Normalise pair order so (A,B) and (B,A) map to the same cache row
//  2. Check Supabase dna_matches cache — if hit, return immediately (free)
//  3. Fetch both fragrances from the DB
//  4. Run a local scoring algorithm (no AI cost)
//  5. Call Claude Haiku for a 2–3 sentence luxury editorial narrative
//  6. Store result in cache for next time
//
// Scoring algorithm:
//   primary_vector match       →  35 pts (exact) / 15 pts (adjacent family)
//   dominant_accords overlap   →  up to 50 pts  (shared / union × 50)
//   concentration match        →  10 pts
//   inspired_by bonus          →   5 pts (one inspired by the other)
//   ─────────────────────────────────────
//   Maximum                    → 100 pts

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';

// ── Adjacent olfactory families ───────────────────────────────────────────────
// Fragrances whose primary vectors share a family get partial credit instead
// of zero. E.g. amber and spicy share warmth; woody and earthy share earthiness.
const ADJACENT_FAMILIES: [string, string][] = [
  ['amber', 'spicy'],
  ['amber', 'oriental'],
  ['woody', 'earthy'],
  ['woody', 'smoky'],
  ['citrus', 'aromatic'],
  ['citrus', 'fresh'],
  ['aquatic', 'fresh'],
  ['floral', 'powdery'],
  ['floral', 'fruity'],
  ['gourmand', 'sweet'],
  ['oriental', 'spicy'],
];

function vectorsAdjacent(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  return ADJACENT_FAMILIES.some(
    ([x, y]) => (la.includes(x) && lb.includes(y)) || (la.includes(y) && lb.includes(x))
  );
}

// ── Category labels ───────────────────────────────────────────────────────────
function categoryLabel(score: number): string {
  if (score >= 90) return 'Virtually Twin';
  if (score >= 75) return 'Strategic Inspiration';
  if (score >= 60) return 'Sophisticated Homage';
  if (score >= 40) return 'Olfactive Cousin';
  return 'Distant Relatives';
}

// ── Fragrance type from DB ─────────────────────────────────────────────────────
type FragranceRow = {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  primary_vector: string;
  dominant_accords: string[];
  inspired_by: string | null;
};

// ── Local scoring algorithm ────────────────────────────────────────────────────
function computeScore(a: FragranceRow, b: FragranceRow): number {
  let score = 0;

  // 1. Primary vector (35 pts exact, 15 pts adjacent)
  if (a.primary_vector && b.primary_vector) {
    if (a.primary_vector.toLowerCase() === b.primary_vector.toLowerCase()) {
      score += 35;
    } else if (vectorsAdjacent(a.primary_vector, b.primary_vector)) {
      score += 15;
    }
  }

  // 2. Dominant accords overlap (up to 50 pts — Jaccard-style)
  const accordsA = (a.dominant_accords ?? []).map((x) => x.toLowerCase());
  const accordsB = (b.dominant_accords ?? []).map((x) => x.toLowerCase());
  if (accordsA.length > 0 && accordsB.length > 0) {
    const shared = accordsA.filter((x) => accordsB.includes(x)).length;
    const union = new Set([...accordsA, ...accordsB]).size;
    const jaccardScore = union > 0 ? (shared / union) * 50 : 0;
    score += Math.round(jaccardScore);
  }

  // 3. Concentration match (10 pts)
  if (a.concentration && b.concentration) {
    if (a.concentration.toLowerCase() === b.concentration.toLowerCase()) {
      score += 10;
    }
  }

  // 4. Inspired-by bonus (5 pts) — one was inspired by the other
  if (a.inspired_by && b.inspired_by !== undefined) {
    const aInspiredName = a.inspired_by.toLowerCase();
    const bFullName = `${b.brand} ${b.name}`.toLowerCase();
    if (aInspiredName.includes(b.name.toLowerCase()) || bFullName.includes(aInspiredName)) {
      score += 5;
    }
  }
  if (b.inspired_by && a.inspired_by !== undefined) {
    const bInspiredName = b.inspired_by.toLowerCase();
    const aFullName = `${a.brand} ${a.name}`.toLowerCase();
    if (bInspiredName.includes(a.name.toLowerCase()) || aFullName.includes(bInspiredName)) {
      score += 5;
    }
  }

  return Math.min(100, score);
}

// ── Claude narrative ──────────────────────────────────────────────────────────
async function generateNarrative(
  a: FragranceRow,
  b: FragranceRow,
  score: number,
  category: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'Configure ANTHROPIC_API_KEY to enable editorial narratives.';

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: `You are a luxury fragrance critic writing for a high-end editorial magazine.
Your prose is precise, evocative, and authoritative — like a hybrid of Luca Turin and Vogue's fashion desk.
Write exactly 2–3 sentences. No lists. No markdown. No filler phrases like "both fragrances" or "these two".`,
    messages: [
      {
        role: 'user',
        content: `DNA Match Score: ${score}/100 — Category: "${category}"

Compare these two fragrances for a fragrance enthusiast:
A: ${a.brand} ${a.name} (${a.concentration}) — ${a.primary_vector} vector, accords: ${(a.dominant_accords ?? []).join(', ')}
B: ${b.brand} ${b.name} (${b.concentration}) — ${b.primary_vector} vector, accords: ${(b.dominant_accords ?? []).join(', ')}

Write 2–3 editorial sentences explaining their olfactive relationship at this score level. Be specific about shared character or where they diverge. Luxury tone, no clichés.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text.trim() : '';
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { fragrance_a_id, fragrance_b_id } = await req.json();

    if (!fragrance_a_id || !fragrance_b_id) {
      return NextResponse.json(
        { error: 'fragrance_a_id and fragrance_b_id are required' },
        { status: 400 }
      );
    }

    // Normalise order so (A,B) and (B,A) always resolve to the same cache row
    const [idA, idB] = [fragrance_a_id, fragrance_b_id].sort() as [string, string];

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // ── 1. Check cache ──────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from('dna_matches')
      .select('score, category, narrative')
      .eq('fragrance_a_id', idA)
      .eq('fragrance_b_id', idB)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // ── 2. Fetch fragrances ─────────────────────────────────────────────────
    const { data: rows, error } = await supabase
      .from('fragrances')
      .select('id, brand, name, concentration, primary_vector, dominant_accords, inspired_by')
      .in('id', [idA, idB]);

    if (error || !rows || rows.length < 2) {
      return NextResponse.json({ error: 'One or both fragrances not found' }, { status: 404 });
    }

    // Sort so fragA always corresponds to idA
    const fragA = rows.find((r) => r.id === idA) as FragranceRow;
    const fragB = rows.find((r) => r.id === idB) as FragranceRow;

    // ── 3. Score + narrative ────────────────────────────────────────────────
    const score = computeScore(fragA, fragB);
    const category = categoryLabel(score);
    const narrative = await generateNarrative(fragA, fragB, score, category);

    // ── 4. Cache result ─────────────────────────────────────────────────────
    // Using service role is ideal for inserts, but publishable key + RLS
    // "insert with check (false)" means only service role can insert —
    // this insert will fail gracefully if called with the anon key.
    // In production, move this insert to a server-side service role client.
    await supabase.from('dna_matches').insert({
      fragrance_a_id: idA,
      fragrance_b_id: idB,
      score,
      category,
      narrative,
    });

    return NextResponse.json({
      score,
      category,
      narrative,
      cached: false,
      // Extra detail for the UI's accord overlap panel
      accord_detail: {
        a_accords: fragA.dominant_accords ?? [],
        b_accords: fragB.dominant_accords ?? [],
        shared: (fragA.dominant_accords ?? []).filter((x) =>
          (fragB.dominant_accords ?? []).map((y) => y.toLowerCase()).includes(x.toLowerCase())
        ),
      },
    });
  } catch (err) {
    console.error('dna-match route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
