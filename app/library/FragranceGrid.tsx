'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Fragrance = {
  id: string;
  brand: string;
  name: string;
  concentration: string | null;
  gender_profile: string | null;
  layering_role: string | null;
};

type Reaction = 'liked' | 'disliked' | 'unworn' | null;

type Props = {
  fragrances: Fragrance[];
  initialReactions: Record<string, Reaction>;
  userId: string;
};

const STAMPS: {
  value: 'liked' | 'disliked' | 'unworn';
  label: string;
  emoji: string;
  activeClass: string;
}[] = [
  {
    value: 'liked',
    label: 'Like',
    emoji: '❤️',
    activeClass: 'bg-rose-50 border-rose-400 text-rose-500',
  },
  {
    value: 'disliked',
    label: 'Dislike',
    emoji: '👎',
    activeClass: 'bg-gray-100 border-gray-400 text-gray-500',
  },
  {
    value: 'unworn',
    label: "Haven't worn",
    emoji: '🤍',
    activeClass: 'bg-blue-50 border-blue-300 text-blue-400',
  },
];

export default function FragranceGrid({ fragrances, initialReactions, userId }: Props) {
  const [reactions, setReactions] = useState<Record<string, Reaction>>(initialReactions);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  async function handleStamp(fragranceId: string, stamp: 'liked' | 'disliked' | 'unworn') {
    const current = reactions[fragranceId] ?? null;
    const next: Reaction = current === stamp ? null : stamp;

    setReactions((prev) => ({ ...prev, [fragranceId]: next }));
    setLoading(fragranceId);

    const { error } = await supabase
      .from('collections')
      .upsert(
        { user_id: userId, fragrance_id: fragranceId, reaction: next },
        { onConflict: 'user_id,fragrance_id' }
      );

    if (error) {
      setReactions((prev) => ({ ...prev, [fragranceId]: current }));
    }

    setLoading(null);
  }

  if (fragrances.length === 0) {
    return <p className="text-gray-400 mt-8">No fragrances in the catalogue yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fragrances.map((f) => {
        const reaction = reactions[f.id] ?? null;
        const isLoading = loading === f.id;

        return (
          <div
            key={f.id}
            className="flex flex-col gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {f.brand}
              </p>
              <h2 className="text-sm font-semibold mt-1 leading-snug text-gray-900">{f.name}</h2>
            </div>

            <div className="flex flex-wrap gap-1">
              {f.concentration && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {f.concentration}
                </span>
              )}
              {f.gender_profile && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {f.gender_profile}
                </span>
              )}
              {f.layering_role && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-500">
                  {f.layering_role}
                </span>
              )}
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100 flex gap-1.5">
              {STAMPS.map((stamp) => {
                const isActive = reaction === stamp.value;
                return (
                  <button
                    key={stamp.value}
                    onClick={() => handleStamp(f.id, stamp.value)}
                    disabled={isLoading}
                    title={stamp.label}
                    className={`flex-1 py-1.5 rounded-xl border text-sm transition-all ${
                      isActive
                        ? stamp.activeClass
                        : 'border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400'
                    } ${isLoading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {stamp.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
