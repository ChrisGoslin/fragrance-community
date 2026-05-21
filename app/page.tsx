'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import type { Session } from '@supabase/supabase-js';

export default function Home() {
  const [collectionCount, setCollectionCount] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }: { data: { session: Session | null } }) => {
        if (!session) return;
        setUserName(session.user.email?.split('@')[0] ?? null);
        const { count, error } = await supabase
          .from('collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        if (error) {
          setCollectionError('Could not load collection count right now.');
          return;
        }
        setCollectionCount(count ?? 0);
      });
  }, []);

  const nav = [
    { href: '/library', label: 'Library', desc: 'Your fragrance shelf', emoji: '🫙' },
    { href: '/learning', label: 'Learning', desc: 'Log & track your sprays', emoji: '📓' },
    { href: '/dna-match', label: 'DNA Match', desc: 'Compare any two fragrances', emoji: '🧬' },
    { href: '/login', label: 'Account', desc: 'Sign in or out', emoji: '🤝' },
  ];

  return (
    <main style={styles.main}>
      <div style={styles.hero}>
        <h1 style={styles.title}>ScentOI</h1>
        <p style={styles.subtitle}>
          {userName ? `Welcome back, ${userName}.` : 'Your personal fragrance operating system.'}
          {collectionCount !== null && collectionCount > 0
            ? ` ${collectionCount} fragrances on your shelf.`
            : ''}
        </p>
      </div>

      <div style={styles.grid}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} style={styles.card}>
            <span style={styles.cardEmoji}>{item.emoji}</span>
            <div>
              <div style={styles.cardLabel}>{item.label}</div>
              <div style={styles.cardDesc}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      {collectionError ? (
        <p style={styles.errorText} role="status">
          {collectionError}
        </p>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '48px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  hero: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: 800, margin: '0 0 8px', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#6b7280', margin: 0 },
  grid: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    textDecoration: 'none',
    color: 'inherit',
    background: 'white',
    transition: 'border-color 0.15s',
  },
  cardEmoji: { fontSize: 28 },
  cardLabel: { fontSize: 16, fontWeight: 600, color: '#111' },
  cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  errorText: { marginTop: 14, fontSize: 13, color: '#b91c1c' },
};
