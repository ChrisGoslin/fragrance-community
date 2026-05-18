// app/api/formulate/route.ts
// Scentral — Formulate engine
// POST /api/formulate
// Input: fragrance1 (name+brand+phase+family), fragrance2 (same), context (time/weather/occasion)
// Output: combo_name, application_steps[], sillage_prediction, occasion_tag, claude_note
//
// Requires: ANTHROPIC_API_KEY in .env.local
// Install: npm install @anthropic-ai/sdk

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';

type FragranceInput = {
  name: string;
  brand: string;
  phase: number;
  phase_label: string;
  family: string;
  projection: string;
  application_zone: string;
  application_method?: string; // optional — not all rows have this column yet
  anosmia_risk: string;
  lean: string;
};

type FormulateRequest = {
  fragrance1: FragranceInput;
  fragrance2: FragranceInput;
  context: {
    time_of_day: string; // "morning" | "afternoon" | "evening" | "night"
    weather: string; // "cold" | "cool" | "warm" | "hot"
    occasion: string; // "daily" | "work" | "date" | "formal" | "casual"
  };
};

const SYSTEM_PROMPT = `You are Scentral's Formulate engine — a fragrance chemistry expert and master perfumer.

Your role is to analyse two fragrances being layered together and generate:
1. A creative, shareable combo name (2-4 words, evocative, TikTok-ready)
2. Precise application steps in order (Phase 1 anchor first, then Phase 2/3)
3. A sillage prediction (how the combo will project and evolve)
4. An occasion tag (one short phrase)
5. A brief expert note explaining WHY these two work chemically/olfactorily

Naming formula — pick the best fit:
- "[Mood] + [Key Note]" e.g. "Midnight Neroli", "Golden Oud"
- "[Occasion] in [Place]" e.g. "Date Night in Dubai", "Rainy Dublin Morning"
- "[Verb-ing] [Imagery]" e.g. "Chasing Amber Shadows", "Stealing Citrus Kisses"
- "[Note 1] x [Note 2] [Context]" e.g. "Oud x Vanilla Afterglow"

Rules:
- Phase 1 (Endothermic Anchor) always applied first to pulse points — it anchors and lasts longest
- Phase 2 (Textural Modulator) layered second — bridges and amplifies
- Phase 3 (Exothermic Top) applied last — projects outward, evolves fastest
- If anosmia risk is High for either fragrance, include a warning in the steps
- Keep application steps practical and specific (e.g. "2 sprays Rifaaqat to inner wrists, let dry 30 seconds")
- Keep the expert note to 2 sentences max

Always respond with valid JSON only. No markdown, no preamble.`;

function buildUserPrompt(req: FormulateRequest): string {
  const { fragrance1, fragrance2, context } = req;

  // Determine order: Phase 1 first, then Phase 2/3
  const [anchor, top] =
    fragrance1.phase <= fragrance2.phase ? [fragrance1, fragrance2] : [fragrance2, fragrance1];

  return `Generate a Formulate result for this layering combination:

FRAGRANCE A (apply first):
- Name: ${anchor.name}
- Brand: ${anchor.brand}
- Phase: ${anchor.phase} — ${anchor.phase_label}
- Olfactory Family: ${anchor.family}
- Projection: ${anchor.projection}
- Application Zone: ${anchor.application_zone}
- Application Method: ${anchor.application_method ?? 'standard spray'}
- Anosmia Risk: ${anchor.anosmia_risk}
- Lean: ${anchor.lean}

FRAGRANCE B (apply second):
- Name: ${top.name}
- Brand: ${top.brand}
- Phase: ${top.phase} — ${top.phase_label}
- Olfactory Family: ${top.family}
- Projection: ${top.projection}
- Application Zone: ${top.application_zone}
- Application Method: ${top.application_method}
- Anosmia Risk: ${top.anosmia_risk}
- Lean: ${top.lean}

CONTEXT:
- Time of day: ${context.time_of_day}
- Weather: ${context.weather}
- Occasion: ${context.occasion}

Respond with this exact JSON structure:
{
  "combo_name": "string (2-4 words, evocative, shareable)",
  "application_steps": [
    "string (step 1 — Fragrance A)",
    "string (step 2 — wait/dry time if needed)",
    "string (step 3 — Fragrance B)",
    "string (optional step 4 — finishing tip)"
  ],
  "sillage_prediction": "string (1-2 sentences on projection + evolution)",
  "occasion_tag": "string (e.g. 'Winter Date Night', 'Friday Work Mode')",
  "anosmia_warning": "string or null (null if no High risk fragrances)",
  "claude_note": "string (2 sentences on why these two work chemically)"
}`;
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found');
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

export async function POST(req: Request) {
  try {
    // Auth guard — only signed-in users can call this paid AI endpoint
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Formulate is not configured yet. Missing ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const body: FormulateRequest = await req.json();

    if (!body.fragrance1 || !body.fragrance2) {
      return NextResponse.json(
        { error: 'fragrance1 and fragrance2 are required' },
        { status: 400 }
      );
    }

    // Default context if not provided
    const context = body.context ?? {
      time_of_day: 'evening',
      weather: 'cool',
      occasion: 'casual',
    };

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt({ ...body, context }),
        },
      ],
    });

    // Extract text content from response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let result;
    try {
      result = parseJsonObject(content.text);
    } catch {
      console.error('Failed to parse Claude response as JSON:', content.text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      result,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (error) {
    console.error('Formulate route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
