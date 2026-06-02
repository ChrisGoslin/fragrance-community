import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import type { Fragrance } from '@/lib/types';

// Subset of Fragrance columns fetched for the stats query.
// Derived from the canonical type so a schema change in lib/types.ts
// propagates here automatically.
type FragranceStat = Pick<Fragrance, 'name' | 'brand' | 'rating' | 'is_public'>;

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const email = user.email ?? 'your account';

  // Guard against malformed JWTs or anonymous sessions where created_at
  // may be missing or not a valid ISO string.
  const rawDate = user.created_at ? new Date(user.created_at) : null;
  const memberSince =
    rawDate && !isNaN(rawDate.getTime())
      ? rawDate.toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown';

  const { data: fragrances, error: statsError } = await supabase
    .from('fragrances')
    .select('name, brand, rating, is_public')
    .eq('user_id', user.id);

  const rows: FragranceStat[] = (fragrances as FragranceStat[] | null) ?? [];
  const total = rows.length;
  const publicCount = rows.filter((f) => f.is_public).length;
  const privateCount = total - publicCount;

  // Type predicate narrows rating to number so reduces need no ?? 0 fallback.
  const rated = rows.filter((f): f is FragranceStat & { rating: number } => f.rating !== null);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((sum, f) => sum + f.rating, 0) / rated.length).toFixed(1)
      : null;
  const topRated =
    rated.length > 0
      ? rated.reduce((best, f) => (f.rating > best.rating ? f : best))
      : null;

  return (
    <main style={{ maxWidth: 560 }}>
      <h1 style={{ marginBottom: 4 }}>Profile</h1>
      <p style={{ marginTop: 0, opacity: 0.6, fontSize: 14 }}>Member since {memberSince}</p>

      {/* Account info */}
      <section
        style={{
          marginTop: 24,
          padding: '16px 20px',
          border: '1px solid #e5e5e5',
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16, marginBottom: 12 }}>Account</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#444' }}>
          <span style={{ color: '#888', display: 'inline-block', width: 80 }}>Email</span>
          {email}
        </p>
      </section>

      {/* Collection stats */}
      <section
        style={{
          marginTop: 16,
          padding: '16px 20px',
          border: '1px solid #e5e5e5',
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16, marginBottom: 16 }}>
          Collection{' '}
          <Link href="/library" style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>
            → View library
          </Link>
        </h2>

        {statsError ? (
          <p style={{ margin: 0, fontSize: 14, color: '#c00' }}>
            Could not load collection stats. Try refreshing the page.
          </p>
        ) : total === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: '#888' }}>
            No fragrances yet.{' '}
            <Link href="/library" style={{ color: '#222' }}>
              Add your first one →
            </Link>
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard label="Total" value={String(total)} />
            <StatCard label="Public" value={String(publicCount)} />
            <StatCard label="Private" value={String(privateCount)} />
            {avgRating !== null && <StatCard label="Avg. rating" value={`${avgRating} / 5`} />}
          </div>
        )}

        {topRated && (
          <p style={{ marginTop: 16, marginBottom: 0, fontSize: 13, color: '#555' }}>
            ⭐ Top-rated:{' '}
            <strong>
              {topRated.name}
              {topRated.brand ? ` by ${topRated.brand}` : ''}
            </strong>{' '}
            ({topRated.rating}/5)
          </p>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#f9f9f9',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{label}</p>
    </div>
  );
}
