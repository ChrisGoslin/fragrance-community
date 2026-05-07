"use client";

// Global error boundary — Next.js renders this automatically if any page
// component throws an unhandled exception.
//
// Without this file, an unexpected error shows a raw crash screen.
// With it, users see a friendly message and can recover without a hard refresh.
//
// Must be a Client Component ("use client") because it uses the React
// error boundary API, which requires client-side lifecycle hooks.

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production you'd send this to an error tracking service like Sentry.
    // For now, log it so you can see it in the browser console.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main
      style={{
        padding: "40px 20px",
        maxWidth: 480,
        textAlign: "center",
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
      <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        An unexpected error occurred. You can try again, or go back to the
        homepage.
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "9px 20px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "9px 20px",
            border: "1px solid #ddd",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>

      {/* Show the error detail in development so you can debug it */}
      {process.env.NODE_ENV === "development" && (
        <details
          style={{
            marginTop: 32,
            textAlign: "left",
            fontSize: 12,
            color: "#666",
          }}
        >
          <summary style={{ cursor: "pointer" }}>Error detail (dev only)</summary>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 6,
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </main>
  );
}
