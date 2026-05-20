// app/api/scan/route.ts
// POST /api/scan
// Input:  { image_base64: string, media_type: "image/jpeg" | "image/png" | "image/webp" }
// Output: { brand: string, name: string, concentration: string, confidence: number, notes: string }
//
// Uses Claude Haiku's vision capability to identify a fragrance bottle from a photo.
// The user can then confirm and add it directly to their collection.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

type ScanResult = {
  brand: string;
  name: string;
  concentration: string;
  confidence: number; // 0-100
  notes: string;      // any extra context Claude provides
};

// Strip markdown code fences before JSON.parse — Claude sometimes wraps
// its JSON output in ```json ... ``` even when asked not to.
function extractJson(text: string): string {
  const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Scan is not configured yet. Missing ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image_base64, media_type } = body as {
      image_base64: string;
      media_type: MediaType;
    };

    if (!image_base64 || !media_type) {
      return NextResponse.json(
        { error: 'image_base64 and media_type are required' },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type,
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: `Look at this fragrance bottle image. Identify the fragrance brand, product name, and concentration (e.g. Eau de Parfum, Eau de Toilette, Parfum, Cologne).

Return ONLY a JSON object — no markdown, no preamble:
{
  "brand": "Brand name",
  "name": "Product name",
  "concentration": "Concentration type",
  "confidence": 85,
  "notes": "Any extra context, or empty string if none"
}

If you cannot identify the fragrance, set confidence to 0 and use "Unknown" for brand and name.`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let result: ScanResult;
    try {
      result = JSON.parse(extractJson(content.text)) as ScanResult;
    } catch {
      console.error('Failed to parse Claude scan response:', content.text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content.text },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('scan route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
