'use client';

import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type Fragrance = {
  id: string;
  brand: string;
  name: string;
  phase: number | null;
  phase_label: string | null;
  family: string | null;
  application_zone: string | null;
  anosmia_risk: 'High' | 'Medium' | 'Low' | null;
  rating: number | null;
  projection: string | null;
  lean: string | null;
};

type Protocol = {
  id: string;
  name: string;
  concept: string | null;
  base_fragrance_name: string;
  base_sprays: number;
  top_fragrance_name: string;
  top_sprays: number;
  third_fragrance_name: string | null;
  third_sprays: number | null;
  predicted_sillage: string | null;
  predicted_hours: string | null;
  occasion: string | null;
  season: string | null;
  anosmia_warning: string | null;
  application_note: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function phaseBadge(phase: number | null): { cls: string; label: string } {
  switch (phase) {
    case 1:
      return { cls: 'bg-blue-900 text-blue-200', label: 'Phase 1 · Anchor' };
    case 2:
      return { cls: 'bg-amber-900 text-amber-200', label: 'Phase 2 · Bridge' };
    case 3:
      return { cls: 'bg-red-900 text-red-200', label: 'Phase 3 · Top' };
    default:
      return { cls: 'bg-slate-800 text-slate-400', label: 'Phase ?' };
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: number | null }) {
  const { cls, label } = phaseBadge(phase);
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function PairingCard({
  fragrance,
  selected,
  onClick,
}: {
  fragrance: Fragrance;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400'
          : 'border-slate-700 bg-slate-800 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{fragrance.brand}</p>
          <p className="text-sm font-semibold text-white">{fragrance.name}</p>
        </div>
        <PhaseBadge phase={fragrance.phase} />
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {fragrance.application_zone && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {fragrance.application_zone}
          </span>
        )}
        {fragrance.projection && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {fragrance.projection}
          </span>
        )}
        {fragrance.anosmia_risk && (
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              fragrance.anosmia_risk === 'High'
                ? 'bg-red-900 text-red-200'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            Anosmia: {fragrance.anosmia_risk}
          </span>
        )}
        {fragrance.rating != null && (
          <span
            aria-label={`Rating: ${fragrance.rating} out of 10`}
            className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
          >
            <span aria-hidden="true">★ </span>
            {fragrance.rating}
          </span>
        )}
      </div>
    </button>
  );
}

function ProtocolCard({ protocol, highlighted }: { protocol: Protocol; highlighted: boolean }) {
  return (
    <article
      className={`p-4 rounded-xl border bg-slate-800 transition-all ${
        highlighted ? 'border-amber-400 ring-2 ring-amber-400' : 'border-slate-700'
      }`}
    >
      <p className="text-sm font-bold text-white mb-1">{protocol.name}</p>
      {protocol.concept && (
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{protocol.concept}</p>
      )}

      <div className="space-y-1 mb-3">
        <p className="text-xs text-slate-300">
          <span className="text-slate-300">Base</span> {protocol.base_fragrance_name} ·{' '}
          {protocol.base_sprays} spray
          {protocol.base_sprays !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-slate-300">
          <span className="text-slate-300">Top</span> {protocol.top_fragrance_name} ·{' '}
          {protocol.top_sprays} spray
          {protocol.top_sprays !== 1 ? 's' : ''}
        </p>
        {protocol.third_fragrance_name && (
          <p className="text-xs text-slate-300">
            <span className="text-slate-300">Third</span> {protocol.third_fragrance_name} ·{' '}
            {protocol.third_sprays} spray
            {protocol.third_sprays !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {protocol.predicted_sillage && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            Sillage: {protocol.predicted_sillage}
          </span>
        )}
        {protocol.predicted_hours && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {protocol.predicted_hours}h
          </span>
        )}
        {protocol.occasion && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {protocol.occasion}
          </span>
        )}
        {protocol.season && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {protocol.season}
          </span>
        )}
      </div>

      {protocol.anosmia_warning && (
        <p className="text-xs bg-red-950 text-red-300 border border-red-800 rounded px-3 py-2 mb-2">
          <span aria-hidden="true">⚠ </span>
          {protocol.anosmia_warning}
        </p>
      )}
      {protocol.application_note && (
        <p className="text-xs text-slate-400 italic">{protocol.application_note}</p>
      )}
    </article>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LayeringClient({
  fragrances,
  protocols,
}: {
  fragrances: Fragrance[];
  protocols: Protocol[];
}) {
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
  const [selectedPairing, setSelectedPairing] = useState<Fragrance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [weather, setWeather] = useState('Mild');
  const [occasion, setOccasion] = useState('Casual');
  const [formulating, setFormulating] = useState(false);
  const [formulateResult, setFormulateResult] = useState<{
    combo_name: string;
    application_steps: string[];
    sillage_prediction: string;
    occasion_tag: string;
    anosmia_warning: string | null;
    claude_note: string;
  } | null>(null);
  const [formulateError, setFormulateError] = useState<string | null>(null);

  // Derived: fragrance search results
  const q = searchQuery.toLowerCase();
  const searchResults = searchQuery.trim()
    ? fragrances.filter(
        (f) => f.brand.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      )
    : [];

  // Derived: compatible pairings
  const compatiblePhases = selectedFragrance
    ? [1, 2, 3].filter((p) => p !== selectedFragrance.phase)
    : [];

  const compatibleFragrances = selectedFragrance
    ? fragrances.filter(
        (f) => f.id !== selectedFragrance.id && compatiblePhases.includes(f.phase ?? -1)
      )
    : [];

  function selectFragrance(f: Fragrance) {
    setSelectedFragrance(f);
    setSelectedPairing(null);
    setSearchQuery('');
    setFormulateResult(null);
    setFormulateError(null);
  }

  const handleFormulate = async () => {
    if (!selectedFragrance || !selectedPairing) return;
    setFormulating(true);
    setFormulateResult(null);
    setFormulateError(null);

    try {
      const res = await fetch('/api/formulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance1: selectedFragrance,
          fragrance2: selectedPairing,
          context: {
            time_of_day: timeOfDay.toLowerCase(),
            weather: weather.toLowerCase(),
            occasion: occasion.toLowerCase(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Formulate failed');
      setFormulateResult(data.result);
    } catch (err) {
      setFormulateError(String(err));
    } finally {
      setFormulating(false);
    }
  };

  // Protocol highlight check
  function isProtocolHighlighted(protocol: Protocol): boolean {
    if (!selectedFragrance) return false;
    const fullName = `${selectedFragrance.brand} ${selectedFragrance.name}`;
    return protocol.base_fragrance_name === fullName || protocol.top_fragrance_name === fullName;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Layering Lab</h1>
          <p className="text-sm text-slate-400 mt-1">
            Select a fragrance to explore compatible pairings and expert protocols
          </p>
        </div>

        {/* ── SECTION 1: Fragrance Selector ── */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search your fragrances by brand or name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Search results */}
          {searchQuery.trim() && (
            <div className="mt-2 border border-slate-700 rounded-xl overflow-hidden bg-slate-800 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-500 px-4 py-3">No fragrances found</p>
              ) : (
                searchResults.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectFragrance(f)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wide">
                        {f.brand}
                      </span>
                      <p className="text-sm text-white font-medium">{f.name}</p>
                    </div>
                    <PhaseBadge phase={f.phase} />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected fragrance pill */}
          {selectedFragrance && !searchQuery && (
            <div className="mt-3 flex items-center gap-3 bg-slate-800 border border-amber-400/40 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  {selectedFragrance.brand}
                </p>
                <p className="text-sm font-semibold text-white">{selectedFragrance.name}</p>
              </div>
              <PhaseBadge phase={selectedFragrance.phase} />
              <button
                onClick={() => {
                  setSelectedFragrance(null);
                  setSelectedPairing(null);
                  setFormulateResult(null);
                }}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none ml-2"
                aria-label="Clear selection"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION 2: Two columns (when fragrance selected) ── */}
        {selectedFragrance && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* LEFT — Compatible Pairings */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Pairs well with <span className="text-white">{selectedFragrance.name}</span>
              </h2>
              {compatibleFragrances.length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-800 rounded-xl p-4">
                  No compatible fragrances found. Check that phase data is set on your fragrances.
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {compatibleFragrances.map((f) => (
                    <PairingCard
                      key={f.id}
                      fragrance={f}
                      selected={selectedPairing?.id === f.id}
                      onClick={() => {
                        setSelectedPairing(selectedPairing?.id === f.id ? null : f);
                        setFormulateResult(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Expert Protocols */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Expert Protocols
              </h2>
              <div className="space-y-3">
                {protocols.map((p) => (
                  <ProtocolCard key={p.id} protocol={p} highlighted={isProtocolHighlighted(p)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: Formulate CTA ── */}
        {selectedFragrance && selectedPairing && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
              Formulate
            </h2>

            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-1 min-w-[160px] bg-slate-900 rounded-xl p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Layer 1</p>
                <p className="text-xs text-slate-400">{selectedFragrance.brand}</p>
                <p className="text-sm font-semibold text-white">{selectedFragrance.name}</p>
                <PhaseBadge phase={selectedFragrance.phase} />
              </div>
              <div
                aria-hidden="true"
                className="flex items-center text-slate-400 text-xl font-light"
              >
                +
              </div>
              <div className="flex-1 min-w-[160px] bg-slate-900 rounded-xl p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Layer 2</p>
                <p className="text-xs text-slate-400">{selectedPairing.brand}</p>
                <p className="text-sm font-semibold text-white">{selectedPairing.name}</p>
                <PhaseBadge phase={selectedPairing.phase} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Time of day
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {['Morning', 'Midday', 'Evening', 'Night'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Weather
                </label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {['Hot', 'Warm', 'Mild', 'Cool', 'Cold'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {['Casual', 'Office', 'Date', 'Formal', 'Evening Out'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleFormulate}
              disabled={formulating || !selectedPairing}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
            >
              {formulating ? 'Formulating...' : '✦ Formulate This Combo'}
            </button>

            {formulating && (
              <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-amber-800/40 animate-pulse">
                <p className="text-amber-400 text-sm">Formulating your combo...</p>
              </div>
            )}

            {formulateResult && (
              <div className="mt-4 p-5 bg-slate-800 rounded-xl border border-amber-500/40 space-y-4">
                <div>
                  <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Your Combo</p>
                  <h3 className="text-2xl font-bold text-white">{formulateResult.combo_name}</h3>
                  <p className="text-sm text-amber-300 mt-0.5">{formulateResult.occasion_tag}</p>
                </div>

                {formulateResult.anosmia_warning && (
                  <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg">
                    <p className="text-xs text-red-400">
                      <span aria-hidden="true">⚠ </span>
                      {formulateResult.anosmia_warning}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Application Steps
                  </p>
                  <ol className="space-y-2">
                    {formulateResult.application_steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-amber-500 font-bold flex-shrink-0">{i + 1}.</span>
                        <span className="text-slate-200">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Sillage Prediction
                  </p>
                  <p className="text-sm text-slate-300">{formulateResult.sillage_prediction}</p>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400 italic">{formulateResult.claude_note}</p>
                </div>
              </div>
            )}

            {formulateError && (
              <div className="mt-4 p-4 bg-red-950/40 border border-red-800/40 rounded-xl">
                <p className="text-sm text-red-400">Error: {formulateError}</p>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 4: Empty state ── */}
        {!selectedFragrance && (
          <div>
            <p className="text-sm text-slate-400 mb-6">
              Select a fragrance above to see compatible pairings
            </p>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Expert Protocols
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {protocols.map((p) => (
                <ProtocolCard key={p.id} protocol={p} highlighted={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
