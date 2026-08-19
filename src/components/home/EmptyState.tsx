import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Not one of the 12 handoff screens — there is no design for "you have no
 * periods yet" on the home route. Kept deliberately small: a sentence and
 * the one action that gets a user out of it, in the same visual language
 * as everything else, rather than inventing a screen the design doesn't
 * specify.
 */
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
      <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Nothing imported yet</p>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, maxWidth: 320 }}>
        Bring in a spreadsheet or statement and Max will build your first month here.
      </p>
      <Link href="/import" style={{ width: "100%", maxWidth: 280 }}>
        <Button variant="primary">Import a file</Button>
      </Link>
    </div>
  );
}
