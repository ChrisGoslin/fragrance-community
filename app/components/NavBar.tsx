"use client";

// NavBar is a Client Component so it can read live auth state from Supabase.
// Server Components (like layout.tsx) can import Client Components — Next.js
// renders the shell on the server and the client takes over on hydration.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar() {
  // null = not yet loaded, "" = logged out, email = logged in
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get the current session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? "");
    });

    // Then keep it in sync whenever the user logs in or out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? "");
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <header
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {/* Brand / home link */}
      <Link
        href="/"
        style={{ fontWeight: 700, textDecoration: "none", marginRight: "auto" }}
      >
        Fragrance Community
      </Link>

      {/* Main nav links */}
      <Link href="/library" style={{ textDecoration: "none" }}>
        Library
      </Link>
      <Link href="/learning" style={{ textDecoration: "none" }}>
        Learning
      </Link>
      <Link href="/community" style={{ textDecoration: "none" }}>
        Community
      </Link>

      {/* Auth section — only shown once we know the auth state */}
      {userEmail === null ? null : userEmail === "" ? (
        <Link
          href="/login"
          style={{
            textDecoration: "none",
            padding: "6px 12px",
            border: "1px solid #222",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          Login
        </Link>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#666" }}>{userEmail}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 14,
              background: "none",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </span>
      )}
    </header>
  );
}
