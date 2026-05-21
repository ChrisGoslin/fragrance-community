import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import DNAMatchClient from './DNAMatchClient';

async function loadFragrances() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: fragrances, error } = await supabase
    .from('fragrances')
    .select('id, brand, name, primary_vector')
    .order('brand')
    .order('name');

  if (error) {
    console.error('Failed to load fragrances:', error);
    return [];
  }

  return fragrances || [];
}

export default async function DNAMatchPage() {
  const fragrances = await loadFragrances();

  return (
    <div style={styles.container}>
      <DNAMatchClient fragrances={fragrances} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d1117',
    color: '#c9d1d9',
    padding: '2rem',
  },
};
