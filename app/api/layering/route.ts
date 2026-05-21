import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const FRAGRANCE_FIELDS =
  'id, brand, name, phase, phase_label, family, application_zone, anosmia_risk, rating, projection, lean';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const fragranceId = request.nextUrl.searchParams.get('fragranceId');
  if (!fragranceId) {
    return NextResponse.json({ error: 'fragranceId required' }, { status: 400 });
  }

  const { data: fragrance, error: fragError } = await supabase
    .from('fragrances')
    .select(FRAGRANCE_FIELDS)
    .eq('id', fragranceId)
    .single();

  if (fragError || !fragrance) {
    return NextResponse.json({ error: 'Fragrance not found' }, { status: 404 });
  }

  const compatiblePhases = [1, 2, 3].filter((p) => p !== fragrance.phase);

  const { data: compatibleFragrances, error: compatError } = await supabase
    .from('fragrances')
    .select(FRAGRANCE_FIELDS)
    .in('phase', compatiblePhases)
    .neq('id', fragranceId)
    .order('phase', { ascending: true });

  if (compatError) {
    return NextResponse.json({ error: 'Failed to fetch compatible fragrances' }, { status: 500 });
  }

  return NextResponse.json({ fragrance, compatibleFragrances });
}
