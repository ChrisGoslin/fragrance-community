'use client';

import { useState, useMemo } from 'react';

interface Fragrance {
  id: string;
  brand: string;
  name: string;
  primary_vector: string;
}

interface DNAMatchResult {
  success: boolean;
  score: number;
  category: string;
  narrative: string;
  cached: boolean;
}

const PALETTE = {
  bg: '#0d1117',
  bgSecondary: '#161b22',
  accent: '#c49a4a',
  accentGreen: '#4a6741',
  accentBlue: '#1e3a5f',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  border: '#30363d',
};

export default function DNAMatchClient({ fragrances }: { fragrances: Fragrance[] }) {
  const [fragA, setFragA] = useState<Fragrance | null>(null);
  const [fragB, setFragB] = useState<Fragrance | null>(null);
  const [result, setResult] = useState<DNAMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const filteredA = useMemo(
    () =>
      fragrances.filter(
        (f) =>
          `${f.brand} ${f.name}`.toLowerCase().includes(searchA.toLowerCase()) && f.id !== fragB?.id
      ),
    [searchA, fragB, fragrances]
  );

  const filteredB = useMemo(
    () =>
      fragrances.filter(
        (f) =>
          `${f.brand} ${f.name}`.toLowerCase().includes(searchB.toLowerCase()) && f.id !== fragA?.id
      ),
    [searchB, fragA, fragrances]
  );

  const handleFindMatch = async () => {
    if (!fragA || !fragB) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/dna-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_a_id: fragA.id,
          fragrance_b_id: fragB.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setExpanded(false);
      } else {
        console.error('Match failed:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryColor = result
    ? result.category.includes('Twin')
      ? PALETTE.accentGreen
      : result.category.includes('Strategic')
        ? PALETTE.accent
        : result.category.includes('Homage')
          ? PALETTE.accentBlue
          : result.category.includes('Cousin')
            ? PALETTE.textMuted
            : PALETTE.textMuted
    : PALETTE.accent;

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>🧬 DNA Match</h1>
      <p style={styles.subtitle}>Compare two fragrances and discover their chemistry</p>

      <div style={styles.pickers}>
        <FragrancePicker
          label="Fragrance A"
          selected={fragA}
          search={searchA}
          onSearchChange={setSearchA}
          filtered={filteredA}
          onSelect={setFragA}
        />

        <div style={styles.vs}>vs</div>

        <FragrancePicker
          label="Fragrance B"
          selected={fragB}
          search={searchB}
          onSearchChange={setSearchB}
          filtered={filteredB}
          onSelect={setFragB}
        />
      </div>

      <button
        onClick={handleFindMatch}
        disabled={!fragA || !fragB || loading}
        style={{
          ...styles.button,
          opacity: !fragA || !fragB || loading ? 0.5 : 1,
          cursor: !fragA || !fragB || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Analyzing...' : 'Find Match'}
      </button>

      {result && (
        <div style={styles.result}>
          <ScoreRing score={result.score} />

          <div
            style={{ ...styles.categoryBadge, borderColor: categoryColor, color: categoryColor }}
          >
            {result.category}
          </div>

          <div style={styles.expanderButton} onClick={() => setExpanded(!expanded)}>
            <span>Read editorial note {expanded ? '▲' : '▼'}</span>
          </div>

          {expanded && <div style={styles.narrative}>{result.narrative}</div>}

          {result.cached && <div style={styles.cached}>🔄 From cache</div>}
        </div>
      )}
    </div>
  );
}

function FragrancePicker({
  label,
  selected,
  search,
  onSearchChange,
  filtered,
  onSelect,
}: {
  label: string;
  selected: Fragrance | null;
  search: string;
  onSearchChange: (s: string) => void;
  filtered: Fragrance[];
  onSelect: (f: Fragrance | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.pickerWrapper}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        placeholder="Search fragrance..."
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        style={styles.input}
      />

      {selected && (
        <div style={styles.selectedTag}>
          {selected.brand} {selected.name}
          <button onClick={() => onSelect(null)} style={styles.clearBtn}>
            ✕
          </button>
        </div>
      )}

      {open && !selected && filtered.length > 0 && (
        <div style={styles.dropdown}>
          {filtered.slice(0, 8).map((f) => (
            <div
              key={f.id}
              onClick={() => {
                onSelect(f);
                onSearchChange('');
                setOpen(false);
              }}
              style={styles.dropdownItem}
            >
              {f.brand} {f.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={styles.ringContainer}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke={PALETTE.border} strokeWidth="2" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={PALETTE.accent}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out',
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <div style={styles.scoreText}>{score}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: '900px',
    margin: '0 auto',
  },

  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: PALETTE.text,
  },

  subtitle: {
    fontSize: '1rem',
    color: PALETTE.textMuted,
    margin: '0 0 2rem 0',
  },

  pickers: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '2rem',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },

  pickerWrapper: {
    position: 'relative',
  },

  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: PALETTE.accent,
  },

  input: {
    width: '100%',
    padding: '0.75rem',
    background: PALETTE.bgSecondary,
    border: `1px solid ${PALETTE.border}`,
    borderRadius: '6px',
    color: PALETTE.text,
    fontSize: '0.95rem',
  },

  selectedTag: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: PALETTE.accentGreen,
    color: '#000',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: '500',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#000',
    cursor: 'pointer',
    fontSize: '1rem',
    marginLeft: '0.5rem',
  },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    right: 0,
    background: PALETTE.bgSecondary,
    border: `1px solid ${PALETTE.border}`,
    borderRadius: '6px',
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
  },

  dropdownItem: {
    padding: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: PALETTE.text,
    borderBottom: `1px solid ${PALETTE.border}`,
  },

  vs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PALETTE.textMuted,
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },

  button: {
    width: '100%',
    padding: '1rem',
    background: PALETTE.accent,
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '2rem',
  },

  result: {
    background: PALETTE.bgSecondary,
    border: `1px solid ${PALETTE.border}`,
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
  },

  ringContainer: {
    position: 'relative',
    width: '120px',
    height: '120px',
    margin: '0 auto 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreText: {
    position: 'absolute',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: PALETTE.accent,
  },

  categoryBadge: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    border: `2px solid`,
    borderRadius: '20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginTop: '1rem',
    marginBottom: '1.5rem',
  },

  expanderButton: {
    padding: '0.75rem',
    color: PALETTE.accent,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },

  narrative: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: PALETTE.text,
    marginTop: '1rem',
    padding: '1rem',
    background: PALETTE.bg,
    borderRadius: '6px',
    fontStyle: 'italic',
  },

  cached: {
    fontSize: '0.8rem',
    color: PALETTE.textMuted,
    marginTop: '1rem',
  },
};
