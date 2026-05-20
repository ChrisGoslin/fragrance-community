'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

interface Fragrance {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  primary_vector: string;
  dominant_accords: string[];
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  inspired_by: string | null;
}

type Reaction = 'liked' | 'disliked' | 'unworn' | null;

interface CollectionItem {
  id: string;
  fragrance_id: string;
  status: 'owned' | 'wishlist' | 'empty' | 'decant';
  wear_state: 'new_spray' | 'tester_skin' | 'macerated_retest' | 'full_wear';
  shelf_tier: number;
  affinity_score: number;
  personal_notes: string | null;
  reaction: Reaction;
  fragrance: Fragrance;
}

const STAMPS: {
  value: 'liked' | 'disliked' | 'unworn';
  label: string;
  emoji: string;
  activeStyle: React.CSSProperties;
}[] = [
  {
    value: 'liked',
    label: 'Like',
    emoji: '❤️',
    activeStyle: { background: '#fff1f2', borderColor: '#fb7185', color: '#e11d48' },
  },
  {
    value: 'disliked',
    label: 'Dislike',
    emoji: '👎',
    activeStyle: { background: '#f3f4f6', borderColor: '#6b7280', color: '#374151' },
  },
  {
    value: 'unworn',
    label: "Haven't worn",
    emoji: '🤍',
    activeStyle: { background: '#eff6ff', borderColor: '#93c5fd', color: '#3b82f6' },
  },
];

const STATUS_LABELS: Record<string, string> = {
  owned: 'Owned',
  wishlist: 'Wishlist',
  empty: 'Empty',
  decant: 'Decant',
};

const WEAR_STATE_LABELS: Record<string, string> = {
  new_spray: 'New – needs maceration',
  tester_skin: 'Tested on skin',
  macerated_retest: 'Ready to retest',
  full_wear: 'Full wear logged',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Top shelf – daily drivers',
  2: 'Middle shelf – occasion',
  3: 'Lower shelf – heavy anchors',
  4: 'Holding zone – macerating',
};

// ── Vector colours ───────────────────────────────────────────────────────────

function vectorColor(vector: string): string {
  const v = vector?.toLowerCase() ?? '';
  if (v.includes('aquatic') || v.includes('marine') || v.includes('fresh')) return '#e0f2fe';
  if (v.includes('gourmand') || v.includes('sweet')) return '#fef3c7';
  if (v.includes('woody') || v.includes('oud')) return '#d6cdb8';
  if (v.includes('spicy') || v.includes('amber')) return '#fee2e2';
  if (v.includes('floral')) return '#fce7f3';
  if (v.includes('citrus') || v.includes('aromatic')) return '#d1fae5';
  if (v.includes('leather') || v.includes('smoky')) return '#e5e7eb';
  if (v.includes('tropical')) return '#fef9c3';
  return '#f3f4f6';
}

function vectorTextColor(vector: string): string {
  const v = vector?.toLowerCase() ?? '';
  if (v.includes('aquatic') || v.includes('marine') || v.includes('fresh')) return '#0369a1';
  if (v.includes('gourmand') || v.includes('sweet')) return '#92400e';
  if (v.includes('woody') || v.includes('oud')) return '#44403c';
  if (v.includes('spicy') || v.includes('amber')) return '#991b1b';
  if (v.includes('floral')) return '#9d174d';
  if (v.includes('citrus') || v.includes('aromatic')) return '#065f46';
  if (v.includes('leather') || v.includes('smoky')) return '#374151';
  if (v.includes('tropical')) return '#713f12';
  return '#374151';
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'collection' | 'search' | 'scan'>('collection');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<number>(0);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Auth ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUserId(session?.user?.id ?? null);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) =>
      setUserId(session?.user?.id ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Load collection ──────────────────────────────────────────────────────

  const loadCollection = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    setLoading(true);
    setLoadingError(null);
    const { data, error } = await supabase
      .from('collections')
      .select(`*, fragrance:fragrances(*)`)
      .eq('user_id', userId)
      .order('shelf_tier', { ascending: true });

    if (!error && data) {
      setCollection(data as CollectionItem[]);
      const map: Record<string, Reaction> = {};
      (data as CollectionItem[]).forEach((item) => {
        map[item.fragrance_id] = item.reaction;
      });
      setReactions(map);
    } else if (error) {
      setLoadingError("Couldn't load your collection. Please try again.");
    }
    setLoading(false);
  }, [userId]);

  // loading starts as true (useState), so no synchronous setState needed here.
  // setState calls below are all inside the async .then() callback — allowed by the rule.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const supabase = createClient();

    supabase
      .from('collections')
      .select(`*, fragrance:fragrances(*)`)
      .eq('user_id', userId)
      .order('shelf_tier', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) {
          setLoadingError(null);
          setCollection(data as CollectionItem[]);
          const map: Record<string, Reaction> = {};
          (data as CollectionItem[]).forEach((item) => {
            map[item.fragrance_id] = item.reaction;
          });
          setReactions(map);
        } else if (error) {
          setLoadingError("Couldn't load your collection. Please try again.");
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // ── Load all fragrances for search ───────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from('fragrances')
      .select('*')
      .order('brand')
      .then(({ data }: { data: Fragrance[] | null }) => {
        if (data) setFragrances(data);
      });
  }, []);

  // ── Search (derived — no effect needed) ─────────────────────────────────

  const q = search.toLowerCase();
  const searchResults = search.trim()
    ? fragrances.filter(
        (f) =>
          f.brand.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.primary_vector?.toLowerCase().includes(q) ||
          f.dominant_accords?.some((a) => a.toLowerCase().includes(q)) ||
          f.inspired_by?.toLowerCase().includes(q)
      )
    : [];

  // ── Add to collection ────────────────────────────────────────────────────

  async function addToCollection(fragrance: Fragrance, status: 'owned' | 'wishlist') {
    if (!userId) return;
    const supabase = createClient();
    setAdding(fragrance.id);
    const { error } = await supabase.from('collections').insert({
      user_id: userId,
      fragrance_id: fragrance.id,
      status,
      wear_state: 'new_spray',
      shelf_tier: status === 'owned' ? 4 : 2, // new bottles go to holding zone
    });

    if (error) {
      if (error.code === '23505') {
        showToast('Already in your collection');
      } else {
        showToast('Something went wrong');
      }
    } else {
      showToast(`${fragrance.name} added to ${status === 'owned' ? 'your shelf' : 'wishlist'}`);
      await loadCollection();
      setActiveTab('collection');
    }
    setAdding(null);
  }

  // ── Update collection item ───────────────────────────────────────────────

  async function updateItem(
    id: string,
    updates: Partial<{
      status: string;
      wear_state: string;
      shelf_tier: number;
      personal_notes: string;
    }>
  ) {
    const supabase = createClient();
    const { error } = await supabase.from('collections').update(updates).eq('id', id);
    if (!error) {
      setCollection((prev) =>
        prev.map((item) => (item.id === id ? ({ ...item, ...updates } as CollectionItem) : item))
      );
    }
  }

  // ── Stamp reaction ───────────────────────────────────────────────────────

  async function handleStamp(fragranceId: string, stamp: 'liked' | 'disliked' | 'unworn') {
    if (!userId) return;
    const supabase = createClient();
    const current = reactions[fragranceId] ?? null;
    const next: Reaction = current === stamp ? null : stamp;

    setReactions((prev) => ({ ...prev, [fragranceId]: next }));

    const { error } = await supabase
      .from('collections')
      .upsert(
        { user_id: userId, fragrance_id: fragranceId, reaction: next },
        { onConflict: 'user_id,fragrance_id' }
      );

    if (error) {
      setReactions((prev) => ({ ...prev, [fragranceId]: current }));
    }
  }

  // ── Remove from collection ───────────────────────────────────────────────

  async function removeFromCollection(id: string, name: string) {
    if (!confirm(`Remove ${name} from your collection?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (!error) {
      setCollection((prev) => prev.filter((item) => item.id !== id));
      showToast(`${name} removed`);
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Filtered collection ──────────────────────────────────────────────────

  const filtered = collection.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterTier !== 0 && item.shelf_tier !== filterTier) return false;
    return true;
  });

  const inCollection = new Set(collection.map((c) => c.fragrance_id));

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <main style={styles.main}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔐</div>
          <h2 style={styles.emptyTitle}>Sign in to access your library</h2>
          <p style={styles.emptyText}>Your fragrance collection lives here.</p>
          <Link href="/login" style={styles.primaryButton}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={styles.main}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Library</h1>
          <p style={styles.subtitle}>
            {collection.length} fragrance{collection.length !== 1 ? 's' : ''} on your shelf
          </p>
        </div>
        <button
          style={styles.primaryButton}
          onClick={() => {
            setActiveTab('search');
            setTimeout(() => document.getElementById('search-input')?.focus(), 50);
          }}
        >
          + Add fragrance
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'collection' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('collection')}
        >
          My collection
        </button>
        <button
          style={activeTab === 'search' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('search')}
        >
          Search & add
        </button>
        <button
          style={activeTab === 'scan' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('scan')}
        >
          📸 Scan bottle
        </button>
      </div>

      {/* ── COLLECTION TAB ── */}
      {activeTab === 'collection' && (
        <div>
          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.filterGroup}>
              {['all', 'owned', 'wishlist', 'empty', 'decant'].map((s) => (
                <button
                  key={s}
                  style={filterStatus === s ? styles.filterActive : styles.filterChip}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <select
              style={styles.select}
              value={filterTier}
              onChange={(e) => setFilterTier(Number(e.target.value))}
            >
              <option value={0}>All shelves</option>
              {[1, 2, 3, 4].map((t) => (
                <option key={t} value={t}>
                  Tier {t} – {TIER_LABELS[t].split('–')[1].trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Collection grid */}
          {loading ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>Loading your collection…</p>
            </div>
          ) : loadingError ? (
            <div style={styles.emptyState}>
              <p style={styles.errorText} role="status">
                {loadingError}
              </p>
              <button style={styles.primaryButton} onClick={() => loadCollection()}>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🫙</div>
              <h2 style={styles.emptyTitle}>
                {collection.length === 0 ? 'Your shelf is empty' : 'Nothing matches that filter'}
              </h2>
              <p style={styles.emptyText}>
                {collection.length === 0
                  ? 'Search the catalogue and add your first fragrance.'
                  : 'Try changing the filter above.'}
              </p>
              {collection.length === 0 && (
                <button style={styles.primaryButton} onClick={() => setActiveTab('search')}>
                  Browse catalogue
                </button>
              )}
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((item) => (
                <CollectionCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  reaction={reactions[item.fragrance_id] ?? null}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onUpdate={updateItem}
                  onRemove={removeFromCollection}
                  onStamp={handleStamp}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH TAB ── */}
      {activeTab === 'search' && (
        <div>
          <input
            id="search-input"
            style={styles.searchInput}
            type="text"
            placeholder="Search by brand, name, accord, or inspiration…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {search.trim() === '' ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <p style={styles.emptyText}>
                Search across {fragrances.length} fragrances by brand, name, scent family, or dupe
                reference.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No results for &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div style={styles.searchResults}>
              <p style={styles.resultCount}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((f) => {
                const alreadyAdded = inCollection.has(f.id);
                return (
                  <div key={f.id} style={styles.searchCard}>
                    <div style={styles.searchCardTop}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.searchBrand}>{f.brand}</div>
                        <div style={styles.searchName}>{f.name}</div>
                        <div style={styles.searchMeta}>
                          <span>{f.concentration}</span>
                          {f.inspired_by && (
                            <span style={styles.dupe}>inspired by {f.inspired_by}</span>
                          )}
                        </div>
                        <div style={styles.accordRow}>
                          <span
                            style={{
                              ...styles.vectorBadge,
                              background: vectorColor(f.primary_vector),
                              color: vectorTextColor(f.primary_vector),
                            }}
                          >
                            {f.primary_vector}
                          </span>
                          {f.dominant_accords?.slice(0, 3).map((a) => (
                            <span key={a} style={styles.accordChip}>
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={styles.addButtons}>
                        {alreadyAdded ? (
                          <span style={styles.addedBadge}>In collection</span>
                        ) : (
                          <>
                            <button
                              style={styles.addOwned}
                              disabled={adding === f.id}
                              onClick={() => addToCollection(f, 'owned')}
                            >
                              {adding === f.id ? '…' : 'Add owned'}
                            </button>
                            <button
                              style={styles.addWishlist}
                              disabled={adding === f.id}
                              onClick={() => addToCollection(f, 'wishlist')}
                            >
                              Wishlist
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Stamps */}
                    <div style={styles.stampRow}>
                      {STAMPS.map((stamp) => {
                        const isActive = reactions[f.id] === stamp.value;
                        return (
                          <button
                            key={stamp.value}
                            title={stamp.label}
                            aria-label={stamp.label}
                            aria-pressed={isActive}
                            onClick={() => handleStamp(f.id, stamp.value)}
                            style={{
                              ...styles.stampBtn,
                              ...(isActive ? stamp.activeStyle : {}),
                            }}
                          >
                            {stamp.emoji}
                          </button>
                        );
                      })}
                    </div>

                    {/* Note pyramid preview */}
                    <div style={styles.pyramid}>
                      {f.top_notes?.length > 0 && (
                        <div style={styles.pyramidRow}>
                          <span style={styles.pyramidLabel}>Top</span>
                          <span style={styles.pyramidNotes}>{f.top_notes.join(', ')}</span>
                        </div>
                      )}
                      {f.heart_notes?.length > 0 && (
                        <div style={styles.pyramidRow}>
                          <span style={styles.pyramidLabel}>Heart</span>
                          <span style={styles.pyramidNotes}>{f.heart_notes.join(', ')}</span>
                        </div>
                      )}
                      {f.base_notes?.length > 0 && (
                        <div style={styles.pyramidRow}>
                          <span style={styles.pyramidLabel}>Base</span>
                          <span style={styles.pyramidNotes}>{f.base_notes.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SCAN TAB ── */}
      {activeTab === 'scan' && (
        <ScanTab
          fragrances={fragrances}
          onAdd={(fragrance, status) => addToCollection(fragrance, status)}
        />
      )}

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </main>
  );
}

// ── Scan tab ─────────────────────────────────────────────────────────────────
// Point camera at a bottle → Claude identifies brand + name → confirm + add.

type ScanResult = {
  brand: string;
  name: string;
  concentration: string;
  confidence: number;
  notes: string;
};

function ScanTab({
  fragrances,
  onAdd,
}: {
  fragrances: Fragrance[];
  onAdd: (fragrance: Fragrance, status: 'owned' | 'wishlist') => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [matched, setMatched] = useState<Fragrance | null>(null);

  async function handleImage(file: File) {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    setMatched(null);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');

      setScanResult(data as ScanResult);

      // Try to match against catalogue
      const nameLower = (data.name as string).toLowerCase();
      const brandLower = (data.brand as string).toLowerCase();
      const catalogueMatch = fragrances.find(
        (f) =>
          f.name.toLowerCase().includes(nameLower) ||
          (f.brand.toLowerCase().includes(brandLower) && f.name.toLowerCase().includes(nameLower.split(' ')[0]))
      );
      setMatched(catalogueMatch ?? null);
    } catch (err) {
      setScanError(String(err));
    } finally {
      setScanning(false);
    }
  }

  function confidenceBadgeColor(confidence: number): string {
    if (confidence >= 80) return '#22c55e'; // green
    if (confidence >= 50) return '#f59e0b'; // amber
    return '#ef4444';                       // red
  }

  const inputStyle: React.CSSProperties = {
    display: 'none',
  };

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Upload / camera trigger */}
      <label
        htmlFor="scan-input"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '40px 24px',
          border: '2px dashed #374151',
          borderRadius: 16,
          cursor: 'pointer',
          background: '#111827',
          textAlign: 'center',
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ fontSize: 36 }}>📸</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
            Take a photo or upload
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Point at the bottle — Claude will identify the fragrance
          </p>
        </div>
      </label>
      <input
        id="scan-input"
        type="file"
        accept="image/*"
        capture="environment"
        style={inputStyle}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImage(file);
          // Reset so the same file can be re-selected
          e.target.value = '';
        }}
      />

      {/* Loading */}
      {scanning && (
        <div style={{ marginTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Identifying fragrance…
        </div>
      )}

      {/* Error */}
      {scanError && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 12 }}>
          <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{scanError}</p>
        </div>
      )}

      {/* Result */}
      {scanResult && (
        <div style={{ marginTop: 20, padding: '20px 16px', background: '#111827', border: '1px solid #1f2937', borderRadius: 16 }}>
          {/* Confidence badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>{scanResult.brand}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>{scanResult.name}</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{scanResult.concentration}</p>
            </div>
            <span style={{
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: `${confidenceBadgeColor(scanResult.confidence)}22`,
              color: confidenceBadgeColor(scanResult.confidence),
              border: `1px solid ${confidenceBadgeColor(scanResult.confidence)}44`,
              flexShrink: 0,
            }}>
              {scanResult.confidence}% confident
            </span>
          </div>

          {scanResult.notes && (
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, fontStyle: 'italic' }}>
              {scanResult.notes}
            </p>
          )}

          {/* Catalogue match or no-match message */}
          {matched ? (
            <div>
              <p style={{ fontSize: 12, color: '#22c55e', marginBottom: 12 }}>
                ✓ Found in your catalogue
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onAdd(matched, 'owned')}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    background: '#c49a4a', color: '#0d1117', border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  + Add to shelf
                </button>
                <button
                  onClick={() => onAdd(matched, 'wishlist')}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    background: 'transparent', color: '#94a3b8',
                    border: '1px solid #374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Wishlist
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
              Not in your catalogue yet. Search &amp; add it manually, then scan again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Collection card ───────────────────────────────────────────────────────────

function CollectionCard({
  item,
  expanded,
  reaction,
  onToggle,
  onUpdate,
  onRemove,
  onStamp,
}: {
  item: CollectionItem;
  expanded: boolean;
  reaction: Reaction;
  onToggle: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onRemove: (id: string, name: string) => void;
  onStamp: (fragranceId: string, stamp: 'liked' | 'disliked' | 'unworn') => void;
}) {
  const f = item.fragrance;
  const [notes, setNotes] = useState(item.personal_notes ?? '');

  return (
    <div style={styles.card}>
      {/* Card header – always visible */}
      <div style={styles.cardHeader} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={styles.cardBrand}>{f.brand}</div>
          <div style={styles.cardName}>{f.name}</div>
          <div style={styles.cardMeta}>
            <span
              style={{
                ...styles.vectorBadge,
                background: vectorColor(f.primary_vector),
                color: vectorTextColor(f.primary_vector),
                fontSize: 11,
              }}
            >
              {f.primary_vector}
            </span>
            <span style={styles.tierBadge}>T{item.shelf_tier}</span>
            <span
              style={{
                ...styles.statusDot,
                background:
                  item.status === 'owned'
                    ? '#22c55e'
                    : item.status === 'wishlist'
                      ? '#f59e0b'
                      : item.status === 'empty'
                        ? '#ef4444'
                        : '#94a3b8',
              }}
            />
            <span style={styles.cardMetaText}>{STATUS_LABELS[item.status]}</span>
          </div>
        </div>
        <span style={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={styles.cardBody}>
          {/* Note pyramid */}
          <div style={styles.pyramid}>
            {f.top_notes?.length > 0 && (
              <div style={styles.pyramidRow}>
                <span style={styles.pyramidLabel}>Top</span>
                <span style={styles.pyramidNotes}>{f.top_notes.join(', ')}</span>
              </div>
            )}
            {f.heart_notes?.length > 0 && (
              <div style={styles.pyramidRow}>
                <span style={styles.pyramidLabel}>Heart</span>
                <span style={styles.pyramidNotes}>{f.heart_notes.join(', ')}</span>
              </div>
            )}
            {f.base_notes?.length > 0 && (
              <div style={styles.pyramidRow}>
                <span style={styles.pyramidLabel}>Base</span>
                <span style={styles.pyramidNotes}>{f.base_notes.join(', ')}</span>
              </div>
            )}
          </div>

          {f.inspired_by && (
            <p style={styles.inspiredBy}>
              Inspired by <strong>{f.inspired_by}</strong>
            </p>
          )}

          {/* Controls */}
          <div style={styles.controlGrid}>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Status</label>
              <select
                style={styles.select}
                value={item.status}
                onChange={(e) => onUpdate(item.id, { status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Wear state</label>
              <select
                style={styles.select}
                value={item.wear_state}
                onChange={(e) => onUpdate(item.id, { wear_state: e.target.value })}
              >
                {Object.entries(WEAR_STATE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Shelf tier</label>
              <select
                style={styles.select}
                value={item.shelf_tier}
                onChange={(e) => onUpdate(item.id, { shelf_tier: Number(e.target.value) })}
              >
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal notes */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Personal notes</label>
            <textarea
              style={styles.textarea}
              value={notes}
              rows={3}
              placeholder="Your thoughts, performance observations, layering ideas…"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdate(item.id, { personal_notes: notes })}
            />
          </div>

          {/* Remove */}
          {/* Stamps */}
          <div style={{ ...styles.stampRow, marginTop: 12 }}>
            {STAMPS.map((stamp) => {
              const isActive = reaction === stamp.value;
              return (
                <button
                  key={stamp.value}
                  title={stamp.label}
                  aria-label={stamp.label}
                  aria-pressed={isActive}
                  onClick={() => onStamp(item.fragrance_id, stamp.value)}
                  style={{
                    ...styles.stampBtn,
                    ...(isActive ? stamp.activeStyle : {}),
                  }}
                >
                  {stamp.emoji} {stamp.label}
                </button>
              );
            })}
          </div>

          <button style={styles.removeButton} onClick={() => onRemove(item.id, f.name)}>
            Remove from collection
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 16px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#111',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
  tabs: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid #e5e7eb',
    marginBottom: 20,
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  },
  tabActive: {
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#111',
    fontWeight: 600,
    borderBottom: '2px solid #111',
    marginBottom: -1,
  },
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    padding: '4px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    background: 'white',
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
  },
  filterActive: {
    padding: '4px 12px',
    border: '1px solid #111',
    borderRadius: 20,
    background: '#111',
    cursor: 'pointer',
    fontSize: 13,
    color: 'white',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    background: 'white',
    cursor: 'pointer',
    width: '100%',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'white',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    cursor: 'pointer',
    gap: 12,
  },
  cardBrand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: { fontSize: 16, fontWeight: 600, margin: '2px 0 6px', color: '#111' },
  cardMeta: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  cardMetaText: { fontSize: 12, color: '#6b7280' },
  chevron: { fontSize: 12, color: '#9ca3af' },
  cardBody: { padding: '0 16px 16px', borderTop: '1px solid #f3f4f6' },
  tierBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    background: '#f3f4f6',
    borderRadius: 4,
    padding: '1px 6px',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
  },
  pyramid: {
    background: '#f9fafb',
    borderRadius: 8,
    padding: '10px 12px',
    margin: '12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  pyramidRow: { display: 'flex', gap: 8, alignItems: 'baseline' },
  pyramidLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 36,
  },
  pyramidNotes: { fontSize: 12, color: '#374151' },
  inspiredBy: { fontSize: 12, color: '#6b7280', margin: '0 0 12px' },
  controlGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    marginBottom: 12,
  },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  controlLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textarea: {
    padding: '8px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    resize: 'vertical',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  removeButton: {
    marginTop: 8,
    padding: '6px 12px',
    border: '1px solid #fecaca',
    borderRadius: 8,
    background: 'white',
    color: '#ef4444',
    fontSize: 12,
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 16,
    boxSizing: 'border-box',
    outline: 'none',
  },
  searchResults: { display: 'flex', flexDirection: 'column', gap: 12 },
  resultCount: { fontSize: 13, color: '#6b7280', margin: '0 0 8px' },
  searchCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    background: 'white',
  },
  searchCardTop: { display: 'flex', gap: 12, marginBottom: 12 },
  searchBrand: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchName: { fontSize: 16, fontWeight: 600, margin: '2px 0 6px', color: '#111' },
  searchMeta: { fontSize: 12, color: '#6b7280', display: 'flex', gap: 8, marginBottom: 8 },
  dupe: { color: '#9ca3af', fontStyle: 'italic' },
  accordRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  vectorBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 20,
    display: 'inline-block',
  },
  accordChip: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 20,
    background: '#f3f4f6',
    color: '#374151',
  },
  addButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 100,
  },
  addOwned: {
    padding: '7px 12px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  addWishlist: {
    padding: '7px 12px',
    background: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  addedBadge: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: 600,
    textAlign: 'center',
    padding: '4px 0',
  },
  primaryButton: {
    padding: '10px 16px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 600, margin: 0, color: '#111' },
  emptyText: { fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 320 },
  errorText: { fontSize: 14, color: '#b91c1c', margin: 0, maxWidth: 320 },
  stampRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  stampBtn: {
    padding: '5px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    background: 'white',
    color: '#9ca3af',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#111',
    color: 'white',
    padding: '10px 20px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 999,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
};
