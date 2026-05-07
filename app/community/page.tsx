"use client";

// Community page — a read-only feed of publicly shared fragrances.
// Anyone can view this page, no login required.
// Supabase's RLS policy allows reading rows where is_public = true.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Fragrance } from "@/lib/types";

// Only the columns we actually display — no user_id needed here
type PublicFragrance = Pick<
  Fragrance,
  "id" | "name" | "brand" | "notes" | "rating" | "created_at"
>;

const STAR_LABELS: Record<number, string> = {
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Outstanding",
};

export default function CommunityPage() {
  const [fragrances, setFragrances] = useState<PublicFragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicFragrances() {
      // Fetch the 50 most recent public fragrances from all users
      const { data, error } = await supabase
        .from("fragrances")
        .select("id, name, brand, notes, rating, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setError(error.message);
      } else {
        setFragrances(data ?? []);
      }
      setLoading(false);
    }

    loadPublicFragrances();
  }, []);

  return (
    <main style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: 4 }}>Community</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Recent fragrances shared by members. Log in and add your own from the{" "}
        <a href="/library" style={{ color: "#222" }}>
          Library
        </a>
        .
      </p>

      {loading ? (
        <p style={{ color: "#888" }}>Loading…</p>
      ) : error ? (
        <div
          style={{
            padding: "12px 16px",
            background: "#fff3f3",
            border: "1px solid #ffcccc",
            borderRadius: 8,
            fontSize: 14,
            color: "#c00",
            marginTop: 24,
          }}
        >
          <strong>Couldn&apos;t load the community feed:</strong> {error}
        </div>
      ) : fragrances.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          No shared entries yet. Be the first — add a fragrance in your{" "}
          <a href="/library">Library</a>{" "}with &quot;Share on Community feed&quot; checked.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {fragrances.map((f) => (
            <div
              key={f.id}
              style={{
                padding: "16px 20px",
                border: "1px solid #e5e5e5",
                borderRadius: 10,
              }}
            >
              {/* Name + brand */}
              <p style={{ margin: 0, fontWeight: 600 }}>{f.name}</p>
              {f.brand && (
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>
                  {f.brand}
                </p>
              )}

              {/* Rating */}
              {f.rating && (
                <p style={{ margin: "6px 0 0", fontSize: 14 }}>
                  {"★".repeat(f.rating)}
                  {"☆".repeat(5 - f.rating)}{" "}
                  <span style={{ color: "#888", fontSize: 12 }}>
                    {STAR_LABELS[f.rating]}
                  </span>
                </p>
              )}

              {/* Notes */}
              {f.notes && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 14,
                    color: "#444",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {f.notes}
                </p>
              )}

              {/* Relative timestamp */}
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#aaa" }}>
                {new Date(f.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
