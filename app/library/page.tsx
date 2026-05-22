'use client';

// Library page — your personal fragrance journal.
// Requires login. Reads/writes to the `fragrances` table in Supabase.
// Supabase Row Level Security ensures you only see your own entries.

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
import type { Fragrance } from '@/lib/types';

const STAR_LABELS: Record<number, string> = {
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Outstanding',
};

export default function LibraryPage() {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Fragrance list ─────────────────────────────────────────────────────────
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Add-fragrance form ─────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(3);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── On mount: read session and subscribe to auth changes ─────────────────
  // getSession() bootstraps the initial state; onAuthStateChange keeps it
  // in sync if the user signs in/out elsewhere (e.g. NavBar, another tab).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthLoading(false);
      if (!session) setFragrances([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load fragrances — wrapped in useCallback so the effect dep is stable ──
  const loadFragrances = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from('fragrances')
      .select('id, user_id, name, brand, notes, rating, is_public, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Supabase returns an error object — show the message so the user
      // knows something went wrong rather than seeing a confusing empty list.
      setListError(error.message);
    } else {
      setFragrances(data ?? []);
    }
    setListLoading(false);
  }, [userId]);

  // ── Load fragrances once we know the user is logged in ────────────────────
  // The rule below flags this as a synchronous setState-in-effect, but
  // loadFragrances only calls setState after an await, so it's safe.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (userId) loadFragrances();
  }, [userId, loadFragrances]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Add a new fragrance ───────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFormError(null);

    const { data: inserted, error } = await supabase
      .from('fragrances')
      .insert({
        user_id: userId,
        name: name.trim(),
        brand: brand.trim() || null,
        notes: notes.trim() || null,
        rating,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) {
      setFormError(error.message);
    } else {
      // Prepend the new item locally — no need for a round-trip to re-fetch
      // the whole list just to get the row we just inserted.
      setFragrances((prev) => [inserted as Fragrance, ...prev]);
      setName('');
      setBrand('');
      setNotes('');
      setRating(3);
    }
    setSaving(false);
  }

  // ── Delete a fragrance ────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    // Optimistic update: remove from UI immediately for a snappy feel.
    const deleted = fragrances.find((f) => f.id === id);
    setFragrances((prev) => prev.filter((f) => f.id !== id));

    const { error } = await supabase.from('fragrances').delete().eq('id', id);

    if (error) {
      // Re-insert only the failed item so overlapping deletes don't clobber
      // each other's state — never restore a full stale snapshot.
      if (deleted) setFragrances((prev) => [deleted, ...prev]);
      setListError(`Delete failed: ${error.message}`);
    }
  }

  // ── Render: loading auth ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <main>
        <p style={{ color: '#888' }}>Loading…</p>
      </main>
    );
  }

  // ── Render: not logged in ─────────────────────────────────────────────────
  if (!userId) {
    return (
      <main>
        <h1>Library</h1>
        <p>
          Your fragrance journal lives here.{' '}
          <a href="/login" style={{ color: '#222', fontWeight: 600 }}>
            Log in
          </a>{' '}
          to start adding scents.
        </p>
      </main>
    );
  }

  // ── Render: logged in ─────────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: 4 }}>Library</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Your personal scent journal. Add fragrances you&apos;ve tried or own.
      </p>

      {/* ── Add fragrance form ── */}
      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Add a fragrance</h2>

        <form onSubmit={handleAdd}>
          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bleu de Chanel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Brand */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Brand</label>
            <input
              type="text"
              placeholder="e.g. Chanel"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              Rating: {rating} / 5 — {STAR_LABELS[rating]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Notes / impressions</label>
            <textarea
              placeholder="What do you smell? How does it wear? What does it remind you of?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Public toggle */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="isPublic" style={{ fontSize: 14, cursor: 'pointer' }}>
              Share on Community feed
            </label>
          </div>

          {formError && (
            <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>⚠ {formError}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '9px 20px',
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Add to library'}
          </button>
        </form>
      </section>

      {/* ── Fragrance list ── */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Your collection ({fragrances.length})</h2>

        {/* Surface any list errors prominently */}
        {listError && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fff3f3',
              border: '1px solid #ffcccc',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              color: '#c00',
            }}
          >
            <strong>Something went wrong:</strong> {listError}
            <button
              onClick={loadFragrances}
              style={{
                marginLeft: 12,
                fontSize: 13,
                cursor: 'pointer',
                background: 'none',
                border: '1px solid #c00',
                borderRadius: 4,
                color: '#c00',
                padding: '2px 8px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {listLoading ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : fragrances.length === 0 && !listError ? (
          <p style={{ opacity: 0.6 }}>Nothing here yet. Add your first fragrance above!</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {fragrances.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '16px 20px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  {/* Name + brand */}
                  <p style={{ margin: 0, fontWeight: 600 }}>{f.name}</p>
                  {f.brand && (
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>{f.brand}</p>
                  )}

                  {/* Rating */}
                  {f.rating && (
                    <p style={{ margin: '6px 0 0', fontSize: 14 }}>
                      {'★'.repeat(f.rating)}
                      {'☆'.repeat(5 - f.rating)}{' '}
                      <span style={{ color: '#888', fontSize: 12 }}>{STAR_LABELS[f.rating]}</span>
                    </p>
                  )}

                  {/* Notes */}
                  {f.notes && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 14,
                        color: '#444',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {f.notes}
                    </p>
                  )}

                  {/* Public/private badge */}
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      fontSize: 11,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: f.is_public ? '#e8f5e9' : '#f5f5f5',
                      color: f.is_public ? '#2e7d32' : '#888',
                    }}
                  >
                    {f.is_public ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(f.id)}
                  title="Remove from library"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#bbb',
                    fontSize: 20,
                    cursor: 'pointer',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// Shared inline styles (keeps the JSX above readable)
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};
