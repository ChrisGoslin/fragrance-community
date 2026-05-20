'use client';

// app/dna-match/DNAMatchClient.tsx
// Luxury editorial DNA Match UI.
//
// Palette (Prada Paradigm / Bleu de Chanel inspired):
//   bg:          #0d1117  — near-black editorial ground
//   surface:     #111827  — card surface
//   border:      #1f2937  — subtle dividers
//   accentAmber: #c49a4a  — gold score ring + CTAs
//   accentGreen: #4a6741  — "Virtually Twin" high-score badge
//   accentBlue:  #1e3a5f  — secondary accents
//   text:        #f8fafc  — primary
//   muted:       #94a3b8  — secondary text

import { useState, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Fragrance = {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  primary_vector: string;
  dominant_accords: string[];
  inspired_by: string | null;
};

type MatchResult = {
  score: number;
  category: string;
  narrative: string;
  cached: boolean;
  accord_detail?: {
    a_accords: string[];
    b_accords: string[];
    shared: string[];
  };
};

// ── Colour helpers ────────────────────────────────────────────────────────────

function categoryColour(category: string): string {
  if (category === 'Virtually Twin') return '#4a6741';      // green
  if (category === 'Strategic Inspiration') return '#c49a4a'; // amber
  if (category === 'Sophisticated Homage') return '#1e3a5f';  // blue
  if (category === 'Olfactive Cousin') return '#44403c';     // warm brown
  return '#374151';                                          // grey — Distant Relatives
}

function scoreRingColour(score: number): string {
  if (score >= 75) return '#c49a4a';   // amber — strong match
  if (score >= 50) return '#1e3a5f';   // blue — moderate
  return '#374151';                    // grey — low
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────
// Animated SVG circle that fills clockwise proportional to the score.

function ScoreRing({ score, animate }: { score: number; animate: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference); // start empty

  useEffect(() => {
    // Always use a timeout so setState is never called synchronously inside
    // the effect body (satisfies react-hooks/set-state-in-effect).
    // When animate is false we reset to empty immediately (0 ms delay).
    // When animate is true we add a 120 ms pause so the ring is visible first.
    const targetOffset = animate
      ? circumference - (score / 100) * circumference
      : circumference;
    const delay = animate ? 120 : 0;
    const timer = setTimeout(() => setDashOffset(targetOffset), delay);
    return () => clearTimeout(timer);
  }, [score, animate, circumference]);

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth="10"
        />
        {/* Progress */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={scoreRingColour(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Score number centred inside the ring */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, letterSpacing: '0.08em' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ── FragrancePicker ───────────────────────────────────────────────────────────

function FragrancePicker({
  label,
  fragrances,
  selected,
  exclude,
  onSelect,
}: {
  label: string;
  fragrances: Fragrance[];
  selected: Fragrance | null;
  exclude: string | null;
  onSelect: (f: Fragrance) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = fragrances.filter((f) => {
    if (f.id === exclude) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return f.brand.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
  }).slice(0, 30); // cap at 30 for performance

  return (
    <div ref={ref} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}
      </div>

      {selected && !open ? (
        // ── Selected state ──
        <button
          onClick={() => { setOpen(true); setQuery(''); }}
          style={{
            width: '100%', textAlign: 'left', background: '#111827',
            border: '1px solid #c49a4a', borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{selected.brand}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{selected.name}</div>
          <div style={{ fontSize: 11, color: '#c49a4a', marginTop: 2 }}>{selected.concentration}</div>
        </button>
      ) : (
        // ── Search state ──
        <div>
          <input
            autoFocus={open}
            placeholder={`Search fragrances…`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111827', border: '1px solid #374151',
              borderRadius: 12, padding: '12px 14px',
              fontSize: 14, color: '#f8fafc',
              outline: 'none',
            }}
          />
          {open && (
            <div style={{
              position: 'absolute', left: 0, right: 0, zIndex: 50,
              background: '#111827', border: '1px solid #374151',
              borderRadius: 12, marginTop: 4,
              maxHeight: 280, overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '12px 14px', color: '#6b7280', fontSize: 13 }}>
                  No matches found
                </div>
              ) : (
                filtered.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { onSelect(f); setOpen(false); setQuery(''); }}
                    style={{
                      width: '100%', textAlign: 'left', background: 'transparent',
                      border: 'none', borderBottom: '1px solid #1f2937',
                      padding: '10px 14px', cursor: 'pointer', color: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1f2937')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.brand}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#f8fafc' }}>{f.name}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AccordOverlap ─────────────────────────────────────────────────────────────
// Three-column layout: [Exclusive A] | [Shared DNA] | [Exclusive B]

function AccordOverlap({
  fragA,
  fragB,
  shared,
}: {
  fragA: Fragrance;
  fragB: Fragrance;
  shared: string[];
}) {
  const sharedSet = new Set(shared.map((x) => x.toLowerCase()));
  const exclusiveA = (fragA.dominant_accords ?? []).filter(
    (x) => !sharedSet.has(x.toLowerCase())
  );
  const exclusiveB = (fragB.dominant_accords ?? []).filter(
    (x) => !sharedSet.has(x.toLowerCase())
  );

  const pill = (text: string, accent: string) => (
    <span
      key={text}
      style={{
        display: 'inline-block', padding: '3px 10px',
        borderRadius: 20, fontSize: 11, fontWeight: 500,
        background: `${accent}22`, color: accent,
        border: `1px solid ${accent}44`, margin: '2px',
      }}
    >
      {text}
    </span>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'start' }}>
      {/* Exclusive A */}
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>
          Only in {fragA.name}
        </div>
        <div style={{ minHeight: 28 }}>
          {exclusiveA.length > 0
            ? exclusiveA.map((a) => pill(a, '#1e3a5f'))
            : <span style={{ fontSize: 12, color: '#4b5563' }}>—</span>}
        </div>
      </div>

      {/* Shared DNA */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#c49a4a', marginBottom: 6, textTransform: 'uppercase' }}>
          Shared DNA
        </div>
        <div style={{ minHeight: 28 }}>
          {shared.length > 0
            ? shared.map((a) => pill(a, '#c49a4a'))
            : <span style={{ fontSize: 12, color: '#4b5563' }}>—</span>}
        </div>
      </div>

      {/* Exclusive B */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>
          Only in {fragB.name}
        </div>
        <div style={{ minHeight: 28 }}>
          {exclusiveB.length > 0
            ? exclusiveB.map((a) => pill(a, '#4a6741'))
            : <span style={{ fontSize: 12, color: '#4b5563' }}>—</span>}
        </div>
      </div>
    </div>
  );
}

// ── Loading dots animation ────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <>
      <style>{`
        @keyframes dna-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        .dna-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #c49a4a; margin: 0 3px; animation: dna-bounce 1.2s infinite; }
        .dna-dot:nth-child(2) { animation-delay: 0.15s; }
        .dna-dot:nth-child(3) { animation-delay: 0.30s; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '24px 0' }}>
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DNAMatchClient({ fragrances }: { fragrances: Fragrance[] }) {
  const [fragA, setFragA] = useState<Fragrance | null>(null);
  const [fragB, setFragB] = useState<Fragrance | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrativeOpen, setNarrativeOpen] = useState(false);

  async function runMatch() {
    if (!fragA || !fragB) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setNarrativeOpen(false);

    try {
      const res = await fetch('/api/dna-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragrance_a_id: fragA.id, fragrance_b_id: fragB.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Match failed');
      setResult(data as MatchResult);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const canMatch = fragA !== null && fragB !== null && !loading;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d1117',
      color: '#f8fafc',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.16em', color: '#c49a4a', margin: '0 0 8px', textTransform: 'uppercase' }}>
            Scentral Intelligence
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: -0.5, color: '#f8fafc' }}>
            DNA Match
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            Select two fragrances to reveal their olfactive relationship — scored across
            vector, accord overlap, and concentration DNA.
          </p>
        </div>

        {/* ── Picker row ── */}
        <div style={{ position: 'relative', display: 'flex', gap: 12, marginBottom: 24 }}>
          <FragrancePicker
            label="Fragrance A"
            fragrances={fragrances}
            selected={fragA}
            exclude={fragB?.id ?? null}
            onSelect={(f) => { setFragA(f); setResult(null); }}
          />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#374151', flexShrink: 0, paddingTop: 22,
          }}>
            ×
          </div>

          <FragrancePicker
            label="Fragrance B"
            fragrances={fragrances}
            selected={fragB}
            exclude={fragA?.id ?? null}
            onSelect={(f) => { setFragB(f); setResult(null); }}
          />
        </div>

        {/* ── CTA button ── */}
        <button
          onClick={runMatch}
          disabled={!canMatch}
          style={{
            width: '100%',
            padding: '14px 0',
            background: canMatch ? '#c49a4a' : '#1f2937',
            color: canMatch ? '#0d1117' : '#4b5563',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: canMatch ? 'pointer' : 'not-allowed',
            letterSpacing: '0.04em',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: 32,
          }}
        >
          {loading ? 'Analysing…' : '✦ Run DNA Match'}
        </button>

        {/* ── Loading state ── */}
        {loading && (
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 20, padding: '24px 20px', marginBottom: 24,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>
              Sequencing olfactive DNA
            </p>
            <LoadingDots />
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div style={{
            background: '#1a0a0a', border: '1px solid #7f1d1d',
            borderRadius: 16, padding: '16px 20px', marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* ── Result ── */}
        {result && fragA && fragB && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Score hero card */}
            <div style={{
              background: '#111827',
              border: `1px solid #1f2937`,
              borderRadius: 20,
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}>
              <ScoreRing score={result.score} animate={true} />

              {/* Category badge */}
              <div style={{
                padding: '5px 16px',
                borderRadius: 20,
                background: `${categoryColour(result.category)}33`,
                border: `1px solid ${categoryColour(result.category)}66`,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: result.score >= 75 ? '#c49a4a' : '#94a3b8',
                textTransform: 'uppercase',
              }}>
                {result.category}
              </div>

              {/* Pair label */}
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0, textAlign: 'center' }}>
                {fragA.brand} <strong style={{ color: '#94a3b8' }}>{fragA.name}</strong>
                {' '}×{' '}
                {fragB.brand} <strong style={{ color: '#94a3b8' }}>{fragB.name}</strong>
              </p>

              {result.cached && (
                <p style={{ fontSize: 11, color: '#4b5563', margin: 0 }}>
                  From cache · instant result
                </p>
              )}
            </div>

            {/* Accord overlap panel */}
            {result.accord_detail && (
              <div style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 20,
                padding: '20px 20px',
              }}>
                <p style={{ fontSize: 10, letterSpacing: '0.12em', color: '#94a3b8', margin: '0 0 16px', textTransform: 'uppercase' }}>
                  Accord Profile
                </p>
                <AccordOverlap
                  fragA={fragA}
                  fragB={fragB}
                  shared={result.accord_detail.shared}
                />
              </div>
            )}

            {/* Editorial narrative — collapsed by default */}
            <div style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 20,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setNarrativeOpen((o) => !o)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: '#94a3b8',
                }}
              >
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Editorial Note
                </span>
                <span style={{ fontSize: 14, transition: 'transform 0.2s', transform: narrativeOpen ? 'rotate(180deg)' : 'none' }}>
                  ▾
                </span>
              </button>
              {narrativeOpen && (
                <div style={{ padding: '0 20px 20px' }}>
                  <p style={{
                    fontSize: 15, lineHeight: 1.7, color: '#cbd5e1',
                    fontStyle: 'italic', margin: 0,
                    borderLeft: '2px solid #c49a4a', paddingLeft: 16,
                  }}>
                    {result.narrative}
                  </p>
                </div>
              )}
            </div>

            {/* Try another pair */}
            <button
              onClick={() => { setFragA(null); setFragB(null); setResult(null); }}
              style={{
                background: 'transparent', border: '1px solid #374151',
                borderRadius: 14, padding: '12px 0', width: '100%',
                fontSize: 13, color: '#6b7280', cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.color = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Try another pair
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
