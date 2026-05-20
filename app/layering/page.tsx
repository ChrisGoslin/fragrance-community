import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import LayeringClient from './LayeringClient';

export const dynamic = 'force-dynamic';

export default async function LayeringPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: fragrances }, { data: protocols }] = await Promise.all([
    supabase
      .from('fragrances')
      .select(
        'id, brand, name, phase, phase_label, family, application_zone, application_method, anosmia_risk, rating, projection, lean'
      )
      .order('brand'),
    supabase.from('layering_protocols').select('*').order('created_at'),
  ]);

  return <LayeringClient fragrances={fragrances ?? []} protocols={protocols ?? []} />;
}
