import Link from "next/link";

/** Shared first-import state for every period-backed main screen. */
export function EmptyState() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "20px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
        Nothing imported yet
      </p>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, maxWidth: 320 }}>
        Bring in a spreadsheet or statement and Max will build your first month here.
      </p>
      <Link
        href="/import"
        style={{
          width: "100%",
          maxWidth: 280,
          height: 56,
          borderRadius: "var(--radius-pill)",
          background: "var(--lime-fill)",
          color: "var(--lime-ink-on-fill)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          textDecoration: "none",
        }}
      >
        Import a file
      </Link>
    </div>
  );
}
