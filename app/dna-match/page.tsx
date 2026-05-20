// app/dna-match/page.tsx
// DNA Match page — server component.
// Loads all fragrances from Supabase at request time and hands them
// to the client component so the pickers don't need their own fetch.

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import DNAMatchClient from './DNAMatchClient';

export const metadata = {
  title: 'DNA Match | ScentOI',
  description: 'Compare any two fragrances and reveal their olfactive relationship score.',
};

export default async function DNAMatchPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: fragrances, error } = await supabase
    .from('fragrances')
    .select('id, brand, name, concentration, primary_vector, dominant_accords, inspired_by')
    .order('brand', { ascending: true });

  if (error) {
    return (
      <main
        style={{ minHeight: '100vh', background: '#0d1117', color: '#f8fafc', padding: '48px 16px' }}
      >
        <p style={{ color: '#ef4444', textAlign: 'center' }}>
          Could not load fragrances. Please try again.
        </p>
      </main>
    );
  }

  return <DNAMatchClient fragrances={fragrances ?? []} />;
}
