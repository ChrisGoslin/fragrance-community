'use client';

import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

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

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = createClient();
    setSubmitting(true);
    setStatus('Sending link...');

    try {
      const requestedNext = new URLSearchParams(window.location.search).get('next') ?? '/profile';
      const next = requestedNext.startsWith('/') ? requestedNext : '/profile';
      const redirectTo = new URL('/auth/callback', window.location.origin);
      redirectTo.searchParams.set('next', next);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo.toString() },
      });

      setStatus(error ? error.message : 'Check your email for the login link.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not send login link. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
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
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send magic link'}
        </button>
      </form>
      {status ? <p role="status">{status}</p> : null}
    </main>
  );
}
