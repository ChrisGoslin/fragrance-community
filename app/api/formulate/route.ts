// app/api/formulate/route.ts
// Scentral — Formulate engine
// POST /api/formulate
// Input: fragrance1 (name+brand+phase+family), fragrance2 (same), context (time/weather/occasion)
// Output: combo_name, application_steps[], sillage_prediction, occasion_tag, claude_note
//
// Requires: ANTHROPIC_API_KEY in .env.local
// Install: npm install @anthropic-ai/sdk

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type FragranceInput = {
  name: string;
  brand: string;
  phase: number;
  phase_label: string;
  family: string;
  projection: string;
  application_zone: string;
  application_method: string;
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
- Application Method: ${anchor.application_method}
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

export async function POST(req: Request) {
  try {
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

    // Prompt caching: the system prompt is large and identical on every call.
    // Passing it as a content block with cache_control tells Anthropic to cache it
    // server-side for 5 minutes. Cached tokens cost ~10% of normal input price,
    // saving ~90% on the system prompt portion for repeated requests.
    //
    // Note: Haiku 4.5 requires a minimum of 4,096 tokens before caching activates.
    // As the system prompt grows (more accord families, scoring rules, etc.)
    // caching will kick in automatically — no code changes needed.
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
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
      result = JSON.parse(content.text);
    } catch {
      // If JSON parse fails, return the raw text for debugging
      console.error('Failed to parse Claude response as JSON:', content.text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content.text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      cache_read_tokens: message.usage.cache_read_input_tokens ?? 0,
      cache_created_tokens: message.usage.cache_creation_input_tokens ?? 0,
    });
  } catch (error) {
    console.error('Formulate route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
