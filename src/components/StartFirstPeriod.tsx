"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startFirstPeriod } from "@/app/rollover-actions";

/**
 * The second way into an account with no data (#46): start a month now,
 * instead of importing a spreadsheet.
 *
 * Deliberately a button and not a page-load side effect. Opening /add must
 * never create a period — a screen that writes because you looked at it is how
 * a user ends up with months they never asked for. One write, on the press.
 */
export function StartFirstPeriod({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await startFirstPeriod();
              router.replace(result.next);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Couldn't start that month.");
            }
          });
        }}
        style={{
          background: "none",
          border: "none",
          padding: "6px 4px",
          color: "var(--text-secondary)",
          fontSize: "var(--type-label)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          cursor: pending ? "default" : "pointer",
        }}
      >
        {pending ? "Starting…" : `Or start ${label} now`}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
