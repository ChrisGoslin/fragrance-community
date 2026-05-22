"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
import type { Session } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks whether the "Send magic link" request is in-flight
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus("Sending link…");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus(
        "Check your email — we sent you a magic link. Click it to log in."
      );
    }
    setSending(false);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(`Sign out failed: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <main>
        <p style={{ color: "#888" }}>Loading…</p>
      </main>
    );
  }

  if (session) {
    return (
      <main style={{ maxWidth: 400 }}>
        <h1>You&apos;re logged in</h1>
        <p style={{ opacity: 0.7 }}>Signed in as {session.user.email}</p>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => router.push("/library")}
            style={{
              padding: "9px 20px",
              background: "#222",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Go to Library
          </button>
          <button
            onClick={signOut}
            style={{
              padding: "9px 20px",
              border: "1px solid #ddd",
              borderRadius: 6,
              background: "none",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>

        {status && <p style={{ color: "red", fontSize: 14, marginTop: 12 }}>{status}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400 }}>
      <h1>Login</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Enter your email and we&apos;ll send you a magic link — no password needed.
      </p>

      <form onSubmit={signIn}>
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="email"
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 14,
              boxSizing: "border-box",
              opacity: sending ? 0.6 : 1,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          style={{
            padding: "9px 20px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {status && (
        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: status.startsWith("Check") ? "#2e7d32" : "#c00",
          }}
        >
          {status}
        </p>
      )}
    </main>
  );
}
