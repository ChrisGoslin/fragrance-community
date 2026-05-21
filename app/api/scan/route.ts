// app/api/scan/route.ts
// Fragrance bottle recognition via Claude Vision
// POST /api/scan
// Input: { image_base64: string, media_type: "image/jpeg" | "image/png" | "image/webp" }
// Output: { brand, name, concentration, confidence, notes }

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

type ScanRequest = {
  image_base64: string;
  media_type: 'image/jpeg' | 'image/png' | 'image/webp';
};

type ScanResult = {
  brand: string;
  name: string;
  concentration: string;
  confidence: number;
  notes: string;
};

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

    const body: ScanRequest = await req.json();
    const { image_base64, media_type } = body;

    if (!image_base64 || !media_type) {
      return NextResponse.json({ error: 'image_base64 and media_type are required' }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: media_type,
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: `Identify the fragrance bottle in this image. Return ONLY a JSON object (no markdown, no explanation):
{
  "brand": "Brand name or null if unsure",
  "name": "Fragrance name or null if unsure",
  "concentration": "EDP, EDT, Parfum, EDC, or null",
  "confidence": 0-100 (your confidence as a percentage),
  "notes": "Brief description of what you see (bottle design, notes visible, etc.)"
}`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 502 });
    }

    // Parse JSON response
    let result: ScanResult;
    try {
      const trimmed = content.text.trim();
      const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      const candidate = fencedMatch?.[1]?.trim() ?? trimmed;
      result = JSON.parse(candidate);
    } catch {
      console.error('Failed to parse Claude vision response:', content.text);
      return NextResponse.json({ error: 'Failed to parse scan result' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Scan route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
