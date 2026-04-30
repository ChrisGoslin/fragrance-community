export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Fragrance Community</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        A personal learning log for scent, built as a hobby MVP.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <a
          href="/library"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Library
        </a>

        <a
          href="/learning"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Learning
        </a>

        <a
          href="/community"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Community
        </a>
      </div>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        Next: we'll create these pages and hook them to data.
      </p>
    </main>
  );
}
