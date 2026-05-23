export default function Home() {
  return (
    <main style={{ padding: "8px 0", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Fragrance Community</h1>
      <p style={{ marginTop: 0, opacity: 0.8, maxWidth: 480 }}>
        A personal learning log for scent. Track what you&apos;ve tried, take notes,
        and see what the community is exploring.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <a
          href="/library"
          style={{
            padding: "12px 18px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <strong>Library</strong>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}>
            Your personal scent journal
          </p>
        </a>

        <a
          href="/learning"
          style={{
            padding: "12px 18px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <strong>Learning</strong>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}>
            Notes on olfactory families &amp; technique
          </p>
        </a>

        <a
          href="/community"
          style={{
            padding: "12px 18px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <strong>Community</strong>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}>
            Recent picks from members
          </p>
        </a>
      </div>
    </main>
  );
}
