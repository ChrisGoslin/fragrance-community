"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";

const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(() => {
        // auth unavailable — show login form
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Sending link…");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setStatus(error ? error.message : "Check your email for the login link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <main><p>Loading...</p></main>;
  }

  if (session) {
    return (
      <main>
        <h1>Logged In</h1>
        <p>Signed in as: {session.user.email}</p>
        <button onClick={signOut}>Sign out</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={signIn}>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send magic link</button>
      </form>
      {status ? <p>{status}</p> : null}
    </main>
  );
}