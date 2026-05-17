import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { fragranceAId, fragranceBId } = await request.json()

  if (!fragranceAId || !fragranceBId) {
    return NextResponse.json({ error: 'fragranceAId and fragranceBId are required' }, { status: 400 })
  }

  // Normalise order so (A,B) and (B,A) always map to the same cache row
  const [idA, idB] = [fragranceAId, fragranceBId].sort()

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* called from Server Component */ }
        },
      },
    }
  )

  // Check cache first — avoids a Claude API call for repeated pairs
  const { data: cached } = await supabase
    .from('dna_matches')
    .select('score, category, narrative')
    .eq('fragrance_a_id', idA)
    .eq('fragrance_b_id', idB)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  // No cache hit — fetch both fragrances then call Claude
  const { data: fragrances } = await supabase
    .from('fragrances')
    .select('id, brand, name, concentration, gender_profile, layering_role')
    .in('id', [idA, idB])

  if (!fragrances || fragrances.length < 2) {
    return NextResponse.json({ error: 'One or both fragrances not found' }, { status: 404 })
  }

  const [fragA, fragB] = fragrances.sort((a, b) => a.id.localeCompare(b.id))

  // Call Claude via the Anthropic HTTP API (no SDK dependency needed)
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Compare these two fragrances and return JSON with keys: score (0-100 DNA match), category (one of: "excellent", "good", "neutral", "poor"), narrative (2-3 sentences explaining the match).

Fragrance A: ${fragA.brand} ${fragA.name} — concentration: ${fragA.concentration}, gender profile: ${fragA.gender_profile}, layering role: ${fragA.layering_role}
Fragrance B: ${fragB.brand} ${fragB.name} — concentration: ${fragB.concentration}, gender profile: ${fragB.gender_profile}, layering role: ${fragB.layering_role}

Return only valid JSON, no markdown.`,
        },
      ],
    }),
  })

  if (!claudeResponse.ok) {
    return NextResponse.json({ error: 'Claude API call failed' }, { status: 502 })
  }

  const claudeData = await claudeResponse.json()
  const raw = claudeData.content?.[0]?.text ?? ''

  let result: { score: number; category: string; narrative: string }
  try {
    result = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse Claude response', raw }, { status: 500 })
  }

  // Store in cache so subsequent calls for this pair skip Claude entirely
  await supabase.from('dna_matches').insert({
    fragrance_a_id: idA,
    fragrance_b_id: idB,
    score: result.score,
    category: result.category,
    narrative: result.narrative,
  })

  return NextResponse.json({ ...result, cached: false })
}
